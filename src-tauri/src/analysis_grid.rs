//! Exact native-cell traversal in increasing physical distance from an observer.
//! Merge monotone row/column streams; the heap has at most twice the shorter
//! raster dimension, rather than sorting or storing every cell of the DEM.
use super::{BinaryHeap, NativeError, QueueState};

pub(crate) struct RadialCells {
    width: usize,
    height: usize,
    ox: usize,
    oy: usize,
    pixel_x: f64,
    pixel_y: f64,
    horizontal: bool,
    queue: BinaryHeap<QueueState>,
}
impl RadialCells {
    pub(crate) fn new(width: usize,height: usize,ox: usize,oy: usize,pixel_x: f64,pixel_y: f64) -> Result<Self,NativeError> {
        let mut queue=BinaryHeap::new();
        queue.try_reserve_exact(width.min(height)*2).map_err(|_|NativeError::Gdal("No hay memoria suficiente para el análisis de visibilidad".into()))?;
        let mut result=Self{width,height,ox,oy,pixel_x,pixel_y,horizontal:width>=height,queue};
        if result.horizontal {for y in 0..height {result.push(ox,y);}}
        else {for x in 0..width {result.push(x,oy);}}
        Ok(result)
    }
    fn push(&mut self,x: usize,y: usize) {
        let dx=(x as f64-self.ox as f64)*self.pixel_x;
        let dy=(y as f64-self.oy as f64)*self.pixel_y;
        // QueueState breaks equal-distance ties by descending index. Reverse
        // the index to retain the original row-major order for equal distances.
        self.queue.push(QueueState{cost:dx*dx+dy*dy,position:self.width*self.height-1-(y*self.width+x)});
    }
}
impl Iterator for RadialCells {
    type Item=(usize,usize,f64);
    fn next(&mut self) -> Option<Self::Item> {
        let item=self.queue.pop()?;
        let index=self.width*self.height-1-item.position;
        let (x,y)=(index%self.width,index/self.width);
        if self.horizontal {
            if x<=self.ox && x>0 {self.push(x-1,y);}
            if x>=self.ox && x+1<self.width {self.push(x+1,y);}
        } else {
            if y<=self.oy && y>0 {self.push(x,y-1);}
            if y>=self.oy && y+1<self.height {self.push(x,y+1);}
        }
        Some((x,y,item.cost))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn radial_merge_visits_every_cell_once_in_exact_distance_order() {
        for (width,height,ox,oy,px,py) in [(13,9,5,2,5.0,5.0),(7,19,0,18,3.0,7.0),(1,100,0,50,5.0,5.0),(100,1,99,0,5.0,5.0)] {
            let mut reference=Vec::new();
            for y in 0..height {for x in 0..width {let dx=(x as f64-ox as f64)*px;let dy=(y as f64-oy as f64)*py;reference.push((x,y,dx*dx+dy*dy));}}
            reference.sort_by(|a,b|a.2.total_cmp(&b.2).then_with(||(a.1*width+a.0).cmp(&(b.1*width+b.0))));
            let mut traversal=RadialCells::new(width,height,ox,oy,px,py).unwrap();
            let mut actual=Vec::new();
            while let Some(cell)=traversal.next() {actual.push(cell);assert!(traversal.queue.len()<=2*width.min(height));}
            assert_eq!(actual,reference);
        }
    }
}
