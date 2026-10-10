const test = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../src/models/Product");

function validProduct(overrides = {}) {
  return new Product({
    pid: "P001",
    pname: "Ban phim",
    price: 250000,
    quantity: 10,
    ...overrides,
  });
}

test("Chap nhan san pham hop le", () => {
  const product = validProduct();

  assert.equal(product.validateSync(), undefined);
});

test("Tu choi san pham thieu pid", () => {
  const product = validProduct({ pid: undefined });
  const error = product.validateSync();

  assert.ok(error?.errors.pid);
});

test("Tu choi san pham thieu pname", () => {
  const product = validProduct({ pname: undefined });
  const error = product.validateSync();

  assert.ok(error?.errors.pname);
});

test("Tu choi gia am", () => {
  const product = validProduct({ price: -1 });
  const error = product.validateSync();

  assert.ok(error?.errors.price);
});

test("Tu choi so luong am", () => {
  const product = validProduct({ quantity: -1 });
  const error = product.validateSync();

  assert.ok(error?.errors.quantity);
});

test("Tu choi so luong khong phai so nguyen", () => {
  const product = validProduct({ quantity: 1.5 });
  const error = product.validateSync();

  assert.ok(error?.errors.quantity);
});

test("Chap nhan gia va so luong bang 0", () => {
  const product = validProduct({ price: 0, quantity: 0 });

  assert.equal(product.validateSync(), undefined);
});