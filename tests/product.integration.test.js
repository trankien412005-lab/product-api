const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const baseURL = process.env.API_BASE_URL || "http://127.0.0.1:3002";

async function request(path, method = "GET", body) {
  const options = {
    method,
    signal: AbortSignal.timeout(10000),
  };

  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  return fetch(`${baseURL}${path}`, options);
}

function productFields(product) {
  return {
    pid: product.pid,
    pname: product.pname,
    price: product.price,
    quantity: product.quantity,
  };
}

test("Healthcheck xac nhan API ket noi MongoDB", async () => {
  const response = await request("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "healthy",
    database: "connected",
  });
});

test("CRUD Product voi MongoDB thuc te", async () => {
  const product = {
    pid: `CI-${randomUUID()}`,
    pname: "Ban phim CI",
    price: 250000,
    quantity: 10,
  };

  const path = `/api/products/${product.pid}`;

  try {
    // CREATE: tao san pham.
    let response = await request("/api/products", "POST", product);
    assert.equal(response.status, 201);

    const created = await response.json();
    assert.ok(created._id);
    assert.deepEqual(productFields(created), product);

    // READ: doc chi tiet.
    response = await request(path);
    assert.equal(response.status, 200);

    const detail = await response.json();
    assert.equal(detail._id, created._id);
    assert.deepEqual(productFields(detail), product);

    // READ: san pham phai xuat hien trong danh sach.
    response = await request("/api/products");
    assert.equal(response.status, 200);

    const products = await response.json();
    assert.ok(Array.isArray(products));
    assert.ok(products.some((item) => item.pid === product.pid));

    // Khong cho phep tao trung pid.
    response = await request("/api/products", "POST", product);
    assert.equal(response.status, 409);

    // UPDATE: sua san pham.
    const updated = {
      ...product,
      pname: "Ban phim co CI",
      price: 450000,
      quantity: 5,
    };

    response = await request(path, "PUT", updated);
    assert.equal(response.status, 200);
    assert.deepEqual(productFields(await response.json()), updated);

    // Doc lai de kiem tra du lieu da duoc luu.
    response = await request(path);
    assert.equal(response.status, 200);
    assert.deepEqual(productFields(await response.json()), updated);

    // DELETE: xoa san pham.
    response = await request(path, "DELETE");
    assert.equal(response.status, 204);

    // San pham da xoa phai khong con.
    response = await request(path);
    assert.equal(response.status, 404);

    // Xoa lai san pham khong ton tai.
    response = await request(path, "DELETE");
    assert.equal(response.status, 404);
  } finally {
    // Don san pham cua test neu mot buoc truoc do that bai.
    await request(path, "DELETE").catch(() => {});
  }
});

test("Tu choi du lieu Product khong hop le qua HTTP", async () => {
  const valid = {
    pid: `INVALID-${randomUUID()}`,
    pname: "San pham kiem thu",
    price: 100000,
    quantity: 2,
  };

  const cases = [
    { ...valid, pid: "" },
    { ...valid, pname: "" },
    { ...valid, price: -1 },
    { ...valid, quantity: -1 },
    { ...valid, quantity: 1.5 },
  ];

  try {
    for (const body of cases) {
      const response = await request("/api/products", "POST", body);

      assert.equal(
        response.status,
        400,
        `Phai tu choi du lieu: ${JSON.stringify(body)}`
      );
    }
  } finally {
    await request(`/api/products/${valid.pid}`, "DELETE").catch(() => {});
  }
});