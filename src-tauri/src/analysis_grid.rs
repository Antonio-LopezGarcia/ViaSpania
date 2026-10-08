//! Exact native-cell traversal in increasing physical distance from an observer.
//! Merge monotone row/column streams; the heap has at most twice the shorter
//! raster dimension, rather than sorting or storing every cell of the DEM.
use super::{BinaryHeap, NativeError, QueueState};

pub(crate) struct AngularHorizon {
    size: usize,
    maximum: Vec<f64>,
    lazy: Vec<f64>,
}

impl AngularHorizon {
    pub(crate) fn new(size: usize) -> Self {
        Self {
            size,
            maximum: vec![f64::NEG_INFINITY; size * 4],
            lazy: vec![f64::NEG_INFINITY; size * 4],
        }
    }

    fn apply(&mut self, node: usize, value: f64) {
        self.maximum[node] = self.maximum[node].max(value);
        self.lazy[node] = self.lazy[node].max(value);
    }

    fn push(&mut self, node: usize) {
        let value = self.lazy[node];
        if value != f64::NEG_INFINITY {
            self.apply(node * 2, value);
            self.apply(node * 2 + 1, value);
            self.lazy[node] = f64::NEG_INFINITY;
        }
    }

    fn update_range(&mut self, node: usize, left: usize, right: usize, ql: usize, qr: usize, value: f64) {
        if ql <= left && right <= qr {
            self.apply(node, value);
            return;
        }
        self.push(node);
        let middle = (left + right) / 2;
        if ql <= middle {
            self.update_range(node * 2, left, middle, ql, qr, value);
        }
        if qr > middle {
            self.update_range(node * 2 + 1, middle + 1, right, ql, qr, value);
        }
        self.maximum[node] = self.maximum[node * 2].max(self.maximum[node * 2 + 1]);
    }

    fn query_range(&mut self, node: usize, left: usize, right: usize, ql: usize, qr: usize) -> f64 {
        if ql <= left && right <= qr {
            return self.maximum[node];
        }
        self.push(node);
        let middle = (left + right) / 2;
        let mut result = f64::NEG_INFINITY;
        if ql <= middle {
            result = result.max(self.query_range(node * 2, left, middle, ql, qr));
        }
        if qr > middle {
            result = result.max(self.query_range(node * 2 + 1, middle + 1, right, ql, qr));
        }
        result
    }

    pub(crate) fn update_circular(&mut self, center: usize, radius: usize, value: f64) {
        if radius.saturating_mul(2).saturating_add(1) >= self.size {
            self.apply(1, value);
            return;
        }
        let start = (center + self.size - radius % self.size) % self.size;
        let end = (center + radius) % self.size;
        if start <= end {
            self.update_range(1, 0, self.size - 1, start, end, value);
        } else {
            self.update_range(1, 0, self.size - 1, start, self.size - 1, value);
            self.update_range(1, 0, self.size - 1, 0, end, value);
        }
    }

    pub(crate) fn max_circular(&mut self, center: usize, radius: usize) -> f64 {
        if radius.saturating_mul(2).saturating_add(1) >= self.size {
            return self.maximum[1];
        }
        let start = (center + self.size - radius % self.size) % self.size;
        let end = (center + radius) % self.size;
        if start <= end {
            self.query_range(1, 0, self.size - 1, start, end)
        } else {
            self.query_range(1, 0, self.size - 1, start, self.size - 1)
                .max(self.query_range(1, 0, self.size - 1, 0, end))
        }
    }
}

pub(crate) struct RadialCells {
    width: usize,
    height: usize,
    ox: usize,
    oy: usize,
    observer_x: f64,
    observer_y: f64,
    pixel_x: f64,
    pixel_y: f64,
    horizontal: bool,
    queue: BinaryHeap<QueueState>,
}
impl RadialCells {
    pub(crate) fn new(
        width: usize,
        height: usize,
        observer_x: f64,
        observer_y: f64,
        pixel_x: f64,
        pixel_y: f64,
    ) -> Result<Self, NativeError> {
        let mut queue = BinaryHeap::new();
        queue
            .try_reserve_exact(width.min(height) * 2)
            .map_err(|_| {
                NativeError::Gdal(
                    "No hay memoria suficiente para el análisis de visibilidad".into(),
                )
            })?;
        let ox = observer_x.round().clamp(0.0, width.saturating_sub(1) as f64) as usize;
        let oy = observer_y.round().clamp(0.0, height.saturating_sub(1) as f64) as usize;
        let mut result = Self {
            width,
            height,
            ox,
            oy,
            observer_x,
            observer_y,
            pixel_x,
            pixel_y,
            horizontal: width >= height,
            queue,
        };
        if result.horizontal {
            for y in 0..height {
                result.push(ox, y);
            }
        } else {
            for x in 0..width {
                result.push(x, oy);
            }
        }
        Ok(result)
    }
    fn push(&mut self, x: usize, y: usize) {
        let dx = (x as f64 - self.observer_x) * self.pixel_x;
        let dy = (y as f64 - self.observer_y) * self.pixel_y;
        // QueueState breaks equal-distance ties by descending index. Reverse
        // the index to retain the original row-major order for equal distances.
        self.queue.push(QueueState {
            cost: dx * dx + dy * dy,
            position: self.width * self.height - 1 - (y * self.width + x),
        });
    }
}
impl Iterator for RadialCells {
    type Item = (usize, usize, f64);
    fn next(&mut self) -> Option<Self::Item> {
        let item = self.queue.pop()?;
        let index = self.width * self.height - 1 - item.position;
        let (x, y) = (index % self.width, index / self.width);
        if self.horizontal {
            if x <= self.ox && x > 0 {
                self.push(x - 1, y);
            }
            if x >= self.ox && x + 1 < self.width {
                self.push(x + 1, y);
            }
        } else {
            if y <= self.oy && y > 0 {
                self.push(x, y - 1);
            }
            if y >= self.oy && y + 1 < self.height {
                self.push(x, y + 1);
            }
        }
        Some((x, y, item.cost))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn angular_horizon_queries_and_updates_across_zero_bearing() {
        let mut horizon = AngularHorizon::new(16);
        horizon.update_circular(0, 2, 3.0);
        assert_eq!(horizon.max_circular(15, 1), 3.0);
        assert_eq!(horizon.max_circular(8, 1), f64::NEG_INFINITY);
        horizon.update_circular(8, 1, 7.0);
        assert_eq!(horizon.max_circular(0, 8), 7.0);
    }

    #[test]
    fn radial_merge_orders_from_the_observers_subcell_position() {
        let (width, height, observer_x, observer_y, px, py) = (11, 7, 4.5, 3.2, 200.0, -200.0);
        let mut reference = Vec::new();
        for y in 0..height {
            for x in 0..width {
                let dx = (x as f64 - observer_x) * px;
                let dy = (y as f64 - observer_y) * py;
                reference.push((x, y, dx * dx + dy * dy));
            }
        }
        let actual: Vec<_> = RadialCells::new(width, height, observer_x, observer_y, px, py)
            .unwrap()
            .collect();
        assert_eq!(actual.len(), reference.len());
        for pair in actual.windows(2) {
            assert!(pair[0].2 <= pair[1].2 + 1e-9 * pair[1].2.max(1.0));
        }
        for (x, y, distance) in actual {
            assert!(reference.iter().any(|expected| {
                expected.0 == x
                    && expected.1 == y
                    && (expected.2 - distance).abs() <= 1e-9 * distance.max(1.0)
            }));
        }
    }

    #[test]
    fn radial_merge_visits_every_cell_once_in_exact_distance_order() {
        for (width, height, ox, oy, px, py) in [
            (13, 9, 5, 2, 5.0, 5.0),
            (7, 19, 0, 18, 3.0, 7.0),
            (1, 100, 0, 50, 5.0, 5.0),
            (100, 1, 99, 0, 5.0, 5.0),
        ] {
            let mut reference = Vec::new();
            for y in 0..height {
                for x in 0..width {
                    let dx = (x as f64 - ox as f64) * px;
                    let dy = (y as f64 - oy as f64) * py;
                    reference.push((x, y, dx * dx + dy * dy));
                }
            }
            reference.sort_by(|a, b| {
                a.2.total_cmp(&b.2)
                    .then_with(|| (a.1 * width + a.0).cmp(&(b.1 * width + b.0)))
            });
            let mut traversal = RadialCells::new(width, height, ox as f64, oy as f64, px, py).unwrap();
            let mut actual = Vec::new();
            while let Some(cell) = traversal.next() {
                actual.push(cell);
                assert!(traversal.queue.len() <= 2 * width.min(height));
            }
            assert_eq!(actual, reference);
        }
    }
}
