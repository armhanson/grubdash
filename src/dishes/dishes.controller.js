const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishBodyExists(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  let notif;

  if (!name || name === "") {
    notif = "Dish must include a name";
  } else if (!description || description === "") {
    notif = "Dish must include a description";
  } else if (!price) {
    notif = "Dish must include a price";
  } else if (price <= 0 || !Number.isInteger(price)) {
    notif = "Dish must have a price that is an integer greater than 0";
  } else if (!image_url || image_url === "") {
    notif = "Dish must include an image";
  }
  if (notif) {
    next({ status: 400, message: notif });
  }
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `${dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function dishIdValidation(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish id does not exist: ${dishId}`,
  });
}

function update(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  res.locals.dish = {
    id: res.locals.dishId,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  res.json({ data: res.locals.dish });
}

function dishBodyIdValidation(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

module.exports = {
  list,
  create: [dishBodyExists, create],
  read: [dishIdValidation, read],
  update: [dishIdValidation, dishBodyExists, dishBodyIdValidation, update],
};
