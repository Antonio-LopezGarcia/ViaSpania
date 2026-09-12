#include <arrow/api.h>
#include <iostream>
int main() {
  arrow::MemoryPool* pool = nullptr;
  auto status = arrow::mimalloc_memory_pool(&pool);
  if (!status.ok() || !pool) return 1;
  arrow::Int64Builder builder(pool);
  if (!builder.Append(42).ok()) return 2;
  std::shared_ptr<arrow::Array> array;
  if (!builder.Finish(&array).ok()) return 3;
  auto values = std::static_pointer_cast<arrow::Int64Array>(array);
  if (values->length() != 1 || values->Value(0) != 42) return 4;
  std::cout << array->ToString() << "\n";
}
