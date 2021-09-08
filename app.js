require("dotenv").config({ path: `${__dirname}/.env` });
const express = require("express");
const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME;
const mongoHost = process.env.DB_HOST;
const mongoUser = process.env.DB_USER;
const mongoKey = process.env.DB_PASS;
const mongoName = process.env.DB_NAME;
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://${mongoUser}:${mongoKey}@${mongoHost}/${mongoName}`
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to your ToDoList!" });
const item2 = new Item({ name: "Hit the + button to add new items." });
const item3 = new Item({
  name: "<--- Hit this to mark an item as completed. This will also delete the item from the list to reduce clutter.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

const today = new Date();
const options = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

const day = today.toLocaleDateString("en-US", options);

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (!err) {
          res.redirect("/");
        }
      });
    } else {
      res.render("list", {
        date: day,
        listName: "To-Do List",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:list", (req, res) => {
  const customListName = _.capitalize(req.params.list);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          date: day,
          listName: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "To-Do List") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const deleteItem = req.body.removeItem;
  const listName = req.body.listName;

  if (listName === "To-Do List") {
    Item.findByIdAndRemove(deleteItem, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deleteItem } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(port, () => {
  console.log(`Server running on http://${host}:${port}`);
});
