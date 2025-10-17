const express = require("express");
require("dotenv").config();
const cors = require("cors");
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkn4tqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    const database = client.db("smartShop");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    // this is routrs  test
    // test

    app.post("/orders", async (req, res) => {
      // console.log(req.body);
      const tran_id = new ObjectId().toString();
      const product = await productsCollection.findOne({
        _id: new ObjectId(req.body.productId),
      });
       if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      const order = req.body;
      //   console.log(order)
      //   console.log(product);
      const data = {
        total_amount: order.totalAmount,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${tran_id}`,
        fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: order.name,
        cus_email: "customer@example.com",
        cus_add1: order.address,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      // console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });

        const finalOrder = {
          product,
          paidStatus: false,
          tranjectionId: tran_id,
        };
        const result = ordersCollection.insertOne(finalOrder);

        console.log("Redirecting to: ", GatewayPageURL);
      });
    });

    app.post("/payment/success/:tranId", async (req, res) => {
      console.log(req.params.tranId);
      const result = await ordersCollection.updateOne(
        {
          tranjectionId: req.params.tranId,
        },
        {
          $set: {
            paidStatus: true,
          },
        }
      );
      console.log(result);
      if (result.modifiedCount > 0) {
        res.redirect(`http://localhost:3000/payment/paymentSuccess`);
      }
    });

    app.post("/payment/fail/:tranId", async (req, res) => {
      const result =await ordersCollection.deleteOne({
        tranjectionId: req.params.tranId,
      });
      if (result.deletedCount) {
        res.redirect(`http://localhost:3000/payment/paymentFail`);
      }
    });

    app.get("/products", async (req, res) => {
      const { category, name, id } = req.query;
      const filter = {};

      if (category) {
        filter.category = category;
      }
      if (name) {
        filter.name = { $regex: name, $options: "i" };
      }
      if (id) {
        filter._id = new ObjectId(id);
      }
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params; // params থেকে id নিলাম
      const result = await productsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.post("/products", async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);
      res.send(result);
      // console.log(data);
    });

    /// test

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
