//! Bounded-memory primitives for exact (f64-cost) raster routing.
use super::{NativeError, Command};
use std::{io::Read, ops::{Index, IndexMut}, path::Path};

pub(crate) use crate::raster_limits::MAX_CELLS;
const PAGE_CELLS: usize = 4096;
const NONE: u32 = u32::MAX;

pub(crate) fn filled<T: Clone>(len: usize, value: T) -> Result<Vec<T>, NativeError> {
    let mut data = Vec::new();
    data.try_reserve_exact(len).map_err(|_| NativeError::Gdal("No hay memoria suficiente para la rejilla de cálculo. Cierre otros cálculos o reduzca el área".into()))?;
    while data.len()<len {
        crate::calculation_cancel::check()?;
        data.resize((data.len()+65536).min(len), value.clone());
    }
    Ok(data)
}

/// Uniform factors occupy only a page table. Allocate a page only when a
/// barrier/facilitator touches it; keep f64 values and the original cell indices.
#[derive(Clone)]
pub(crate) struct Factors {
    len: usize,
    pages: Vec<Option<Box<[f64]>>>,
}
impl Factors {
    pub(crate) fn new(len: usize) -> Self { Self { len, pages: vec![None; len.div_ceil(PAGE_CELLS)] } }
    #[cfg(test)]
    pub(crate) fn iter(&self) -> impl Iterator<Item=&f64> { (0..self.len).map(|i| &self[i]) }
}
impl Index<usize> for Factors {
    type Output = f64;
    fn index(&self, index: usize) -> &f64 {
        assert!(index < self.len);
        self.pages[index / PAGE_CELLS].as_ref().map_or(&1.0, |page| &page[index % PAGE_CELLS])
    }
}
impl IndexMut<usize> for Factors {
    fn index_mut(&mut self, index: usize) -> &mut f64 {
        assert!(index < self.len);
        let page = self.pages[index / PAGE_CELLS].get_or_insert_with(|| vec![1.0; PAGE_CELLS].into_boxed_slice());
        &mut page[index % PAGE_CELLS]
    }
}

/// A decrease-key min-heap with at most one entry per cell. Positions and
/// predecessors fit in u32; costs remain f64. Equal costs use the old queue's
/// descending cell-index tie break, preserving deterministic route selection.
pub(crate) struct Frontier {
    heap: Vec<u32>,
    positions: Vec<u32>,
}
impl Frontier {
    pub(crate) fn new(cells: usize) -> Result<Self, NativeError> {
        let mut heap = Vec::new();
        heap.try_reserve_exact(cells).map_err(|_| NativeError::Gdal("No hay memoria suficiente para la cola de cálculo".into()))?;
        Ok(Self { heap, positions: filled(cells, NONE)? })
    }
    fn earlier(a: u32, b: u32, costs: &[f64]) -> bool {
        costs[a as usize].total_cmp(&costs[b as usize]).then_with(|| b.cmp(&a)).is_lt()
    }
    fn swap(&mut self, a: usize, b: usize) {
        self.heap.swap(a,b);
        self.positions[self.heap[a] as usize] = a as u32;
        self.positions[self.heap[b] as usize] = b as u32;
    }
    pub(crate) fn decrease(&mut self, cell: usize, costs: &[f64]) {
        let mut index = self.positions[cell];
        if index == NONE {
            index = self.heap.len() as u32;
            self.heap.push(cell as u32);
            self.positions[cell] = index;
        }
        let mut index = index as usize;
        while index > 0 {
            let parent = (index-1)/2;
            if !Self::earlier(self.heap[index], self.heap[parent], costs) { break; }
            self.swap(index,parent);
            index = parent;
        }
    }
    pub(crate) fn pop(&mut self, costs: &[f64]) -> Option<(f64,usize)> {
        let cell = *self.heap.first()?;
        let last = self.heap.pop().unwrap();
        self.positions[cell as usize] = NONE;
        if !self.heap.is_empty() {
            self.heap[0] = last;
            self.positions[last as usize] = 0;
            let mut index = 0;
            loop {
                let left = 2*index+1;
                if left >= self.heap.len() { break; }
                let right = left+1;
                let child = if right < self.heap.len() && Self::earlier(self.heap[right],self.heap[left],costs) { right } else { left };
                if !Self::earlier(self.heap[child], self.heap[index], costs) { break; }
                self.swap(index,child);
                index = child;
            }
        }
        Some((costs[cell as usize],cell as usize))
    }
}

pub(crate) fn read_elevations(path: &Path, cells: usize) -> Result<Vec<f32>, NativeError> {
    let mut file = std::fs::File::open(path).map_err(|e| NativeError::Io(e.to_string()))?;
    if file.metadata().map_err(|e| NativeError::Io(e.to_string()))?.len() != cells as u64 * 4 {
        return Err(NativeError::Gdal("GDAL produjo una matriz de elevaciones con tamaño inesperado".into()));
    }
    let mut elevations = Vec::new();
    elevations.try_reserve_exact(cells).map_err(|_| NativeError::Gdal("No hay memoria suficiente para las elevaciones".into()))?;
    let mut buffer = [0_u8; 65536];
    while elevations.len() < cells {
        crate::calculation_cancel::check()?;
        let bytes = ((cells-elevations.len())*4).min(buffer.len());
        file.read_exact(&mut buffer[..bytes]).map_err(|e| NativeError::Io(e.to_string()))?;
        elevations.extend(buffer[..bytes].chunks_exact(4).map(|b| f32::from_le_bytes(b.try_into().unwrap())));
    }
    Ok(elevations)
}

// Conservative admission budget: 42 bytes/cell for dense worst-case search and
// surface arrays, plus headroom for allocation, path reconstruction, serialization,
// cache metadata and the renderer. This is an engineering allowance, not an RSS
// prediction. GDAL's independent cache is bounded to 64 MiB.
pub(crate) fn required_bytes(cells: usize) -> u64 { cells as u64 * 96 + 512 * 1024 * 1024 }
pub(crate) fn check_memory(cells: usize, total: Option<u64>, available: Option<u64>) -> Result<(), NativeError> {
    if cells <= 5_000_000 { return Ok(()); }
    let budget = match (total, available) {
        (Some(total), Some(available)) => (total / 2).min(available.saturating_mul(3) / 4),
        (Some(total), None) => total / 3,
        (None, Some(available)) => available / 2,
        _ => return Err(NativeError::Gdal("No se pudo comprobar la memoria disponible para un análisis de más de 5.000.000 celdas".into())),
    };
    let required = required_bytes(cells);
    if required > budget {
        return Err(NativeError::Gdal(format!("El análisis de {cells} celdas requiere un presupuesto de memoria de {:.1} GiB; el presupuesto disponible es {:.1} GiB. Cierre otras aplicaciones o reduzca el área sin cambiar la resolución", required as f64 / 1073741824.0, budget as f64 / 1073741824.0)));
    }
    Ok(())
}

#[cfg(target_os="macos")]
fn mac_available(text: &str) -> Option<u64> {
    let page_size = text.lines().next()?.split("page size of ").nth(1)?.split_whitespace().next()?.parse::<u64>().ok()?;
    let mut pages = 0_u64;
    for name in ["Pages free:","Pages inactive:","Pages speculative:"] {
        let value = text.lines().find_map(|line| line.strip_prefix(name))?.trim().trim_end_matches('.').parse::<u64>().ok()?;
        pages = pages.checked_add(value)?;
    }
    pages.checked_mul(page_size)
}
pub(crate) fn available_bytes() -> Option<u64> {
    #[cfg(target_os="macos")]
    {
        let output = Command::new("/usr/bin/vm_stat").output().ok()?;
        if !output.status.success() { return None; }
        return mac_available(&String::from_utf8(output.stdout).ok()?);
    }
    #[cfg(target_os="linux")]
    {
        return std::fs::read_to_string("/proc/meminfo").ok()?.lines().find_map(|line| line.strip_prefix("MemAvailable:"))?.split_whitespace().next()?.parse::<u64>().ok()?.checked_mul(1024);
    }
    #[cfg(target_os="windows")]
    {
        let output = Command::new("powershell.exe").args(["-NoProfile","-NonInteractive","-Command","(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"]).output().ok()?;
        if !output.status.success() { return None; }
        return String::from_utf8(output.stdout).ok()?.trim().parse::<u64>().ok()?.checked_mul(1024);
    }
    #[allow(unreachable_code)]
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn factors_allocate_only_touched_pages_and_preserve_f64() {
        let mut factors = Factors::new(MAX_CELLS);
        assert!(factors.pages.iter().all(Option::is_none));
        factors[4095] = 0.123456789012345;
        factors[4096] = 7.0;
        factors[MAX_CELLS-1] = 3.0;
        assert_eq!(factors.pages.iter().filter(|p|p.is_some()).count(),3);
        assert_eq!(factors[4095],0.123456789012345);
        assert_eq!(factors[4094],1.0);
        assert_eq!(factors[MAX_CELLS-1],3.0);
    }
    #[test]
    fn frontier_matches_reference_with_repeated_improvements_and_ties() {
        use std::collections::BinaryHeap;
        use crate::QueueState;
        let mut costs = vec![f64::INFINITY; 4096];
        let mut queue = Frontier::new(costs.len()).unwrap();
        let mut reference = BinaryHeap::new();
        for round in (0..4).rev() {
            for cell in 0..costs.len() {
                let cost = (round*10000 + (cell*7919)%1000) as f64;
                costs[cell] = cost;
                queue.decrease(cell,&costs);
                reference.push(QueueState{cost,position:cell});
            }
            assert_eq!(queue.heap.len(),costs.len());
        }
        while let Some((cost,cell)) = queue.pop(&costs) {
            let expected = loop {let entry=reference.pop().unwrap(); if entry.cost==costs[entry.position] {break entry;}};
            assert_eq!((cost,cell),(expected.cost,expected.position));
        }
        assert!(queue.pop(&costs).is_none());
    }
    #[test]
    fn memory_budget_covers_requested_maximum_and_rejects_pressure() {
        let gib = 1073741824;
        assert_eq!(MAX_CELLS,67_928_064);
        assert!(check_memory(MAX_CELLS,Some(16*gib),Some(12*gib)).is_ok());
        assert!(check_memory(MAX_CELLS,Some(8*gib),Some(6*gib)).is_err());
        assert!(check_memory(MAX_CELLS,Some(48*gib),Some(2*gib)).is_err());
        assert!(check_memory(MAX_CELLS,None,None).is_err());
        assert!(check_memory(5_000_000,None,None).is_ok());
    }
    #[cfg(target_os="macos")]
    #[test]
    fn reads_page_size_and_reclaimable_memory_without_double_counting() {
        assert_eq!(mac_available("Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free: 10.\nPages inactive: 20.\nPages speculative: 3.\nPages purgeable: 8."),Some(33*16384));
        assert_eq!(mac_available("Pages free: 10."),None);
    }
    #[test]
    fn streams_elevations_across_buffer_boundaries_and_checks_size() {
        let path=std::env::temp_dir().join(format!("route-stream-{}",uuid::Uuid::new_v4()));
        let values:Vec<f32>=(0..20000).map(|i|i as f32*0.25-10.0).collect();
        std::fs::write(&path,values.iter().flat_map(|v|v.to_le_bytes()).collect::<Vec<_>>()).unwrap();
        assert_eq!(read_elevations(&path,values.len()).unwrap(),values);
        assert!(read_elevations(&path,values.len()+1).is_err());
        std::fs::remove_file(path).unwrap();
    }
}
