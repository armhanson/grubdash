const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderValidation(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  let notif;

  if (!deliverTo || deliverTo === "") {
    notif = "Order must include a deliverTo";
  } else if (!mobileNumber || mobileNumber === "") {
    notif = "Order must include a mobileNumber";
  } else if (!dishes) {
    notif = "Order must include a dish";
  } else if (dishes.length <= 0 || !Array.isArray(dishes)) {
    notif = "Order must include at least one dish";
  } else {
    for (let dish of dishes) {
      if (
        !dish.quantity ||
        dish.quantity <= 0 ||
        !Number.isInteger(dish.quantity)
      ) {
        notif = `Dish ${dish} must have a quantity that is an integer greater than 0`;
      }
    }
  }
  if (notif) {
    return next({
      status: 404,
      message: notif,
    });
  }

  next();
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  res.locals.order = {
    id: res.locals.order.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  res.json({ data: res.locals.order });
}

function orderIdValidation(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  });
}

function orderStatusValidation(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;

  let notif;

  if (id && id !== orderId) {
    notif = `Order id does not match route id. Order: ${id}, Route: ${orderId}`;
  } else if (
    !status ||
    status === "" ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  ) {
    notif =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  } else if (status === "delivered") {
    notif = "A delivered order cannot be changed";
  }

  if (notif) {
    return next({
      status: 404,
      message: message,
    });
  }
  next();
}

function destroy(req, res) {
  const del = orders.indexOf(res.locals.order);
  orders.splice(del, 1);

  res.sendStatus(204);
}

function deleteValidation(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

module.exports = {
  list,
  create: [orderValidation, create],
  read: [orderIdValidation, read],
  update: [orderValidation, orderIdValidation, orderStatusValidation, update],
  delete: [orderIdValidation, deleteValidation, destroy],
};
