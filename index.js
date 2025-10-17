const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts"); // install: npm install sslcommerz-lts

const app = express();
const port = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ SSLCommerz credentials
const store_id = process.env.STORE_ID || "your_store_id";
const store_passwd = process.env.STORE_PASS || "your_store_pass";
const is_live = false; // false = sandbox mode, true = production

// ✅ MongoDB URI
// ✅ MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkn4tqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // ✅ Database and Collections
        const database = client.db("smartShop");
        const productsCollection = database.collection("products");
        const usersCollection = database.collection("users");
        const ordersCollection = database.collection("orders");
        const cartItemsCollection = database.collection('cartItems');

        app.get("/products", async (req, res) => {
            const { category, name, id, sellerEmail } = req.query;
            const filter = {};

            if (category) filter.category = category;
            if (name) filter.name = { $regex: name, $options: "i" };
            if (id) filter._id = new ObjectId(id);
            if (sellerEmail) filter.sellerEmail = sellerEmail;

            const result = await productsCollection.find(filter).toArray();
            res.send(result);
        });


        app.get("/products/:id", async (req, res) => {
            const { id } = req.params;
            const result = await productsCollection.findOne({
                _id: new ObjectId(id),
            });
            res.send(result);
        });

        app.post("/products", async (req, res) => {
            const data = req.body;

            if (!data.name || !data.price || !data.category) {
                return res.status(400).send({ message: "Required fields missing" });
            }
            data.sellerEmail = data.sellerEmail || data.email;
            if (!data.image) {
                data.image = "https://via.placeholder.com/150";
            }

            data.createdAt = new Date();

            try {
                const result = await productsCollection.insertOne(data);
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });


        app.post("/users", async (req, res) => {
            const userData = req.body;
            const existingUser = await usersCollection.findOne({
                email: userData.email,
            });
            if (existingUser) {
                return res.status(409).send({ message: "User already exists" });
            }
            const result = await usersCollection.insertOne(userData);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const { email, searchEmail } = req.query; 

            if (email) {
                const user = await usersCollection.findOne({ email });
                return res.send(user);
            }

            const filter = {};
            if (searchEmail) {
                filter.email = { $regex: searchEmail, $options: "i" };
            }
            const users = await usersCollection.find(filter).toArray();
            res.send(users);
        });


        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const updatedData = req.body;
            const result = await usersCollection.updateOne(
                { email },
                { $set: updatedData }
            );
            res.send(result);
        });

        app.get("/users/:email/role", async (req, res) => {
            const email = req.params.email;
            try {
                const user = await usersCollection.findOne({ email });
                if (!user)
                    return res.status(404).send({ message: "User not found" });
                res.send({ role: user.role });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

  app.get("/cartItems/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // find all cart items for the given user email
    const userCart = await cartItemsCollection
      .find({ userEmail: email })
      .toArray();

    if (!userCart.length) {
      return res.status(404).send({ message: "No cart items found for this email" });
    }

    res.send(userCart);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).send({ message: "Server error" });
  }
});
//get order by using email
    app.get("/orders/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const orders = await ordersCollection
          .find({ orderUser: email })
          .sort({ orderDate: -1 })
          .toArray();

        if (!orders.length) {
          return res.status(404).send({ message: "No orders found for this user" });
        }

        res.send(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send({ message: "Server error" });
      }
    });


        //as
        // ✅ Create Order and Initiate Payment
        // app.post("/orders", async (req, res) => {
        //   const tran_id = new ObjectId().toString();
        //   const product = await productsCollection.findOne({
        //     _id: new ObjectId(req.body.productId),
        //   });

        //   if (!product) {
        //     return res.status(404).send({ message: "Product not found" });
        //   }

        //   const order = req.body;
        //   const data = {
        //     total_amount: order.totalAmount,
        //     currency: "BDT",
        //     tran_id: tran_id,
        //     success_url: `http://localhost:5000/payment/success/${tran_id}`,
        //     fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        //     cancel_url: "http://localhost:3030/cancel",
        //     ipn_url: "http://localhost:3030/ipn",
        //     shipping_method: "Courier",
        //     product_name: "Computer.",
        //     product_category: "Electronic",
        //     product_profile: "general",
        //     cus_name: order.name,
        //     cus_email: "customer@example.com",
        //     cus_add1: order.address,
        //     cus_add2: "Dhaka",
        //     cus_city: "Dhaka",
        //     cus_state: "Dhaka",
        //     cus_postcode: "1000",
        //     cus_country: "Bangladesh",
        //     cus_phone: "01711111111",
        //     cus_fax: "01711111111",
        //     ship_name: "Customer Name",
        //     ship_add1: "Dhaka",
        //     ship_add2: "Dhaka",
        //     ship_city: "Dhaka",
        //     ship_state: "Dhaka",
        //     ship_postcode: 1000,
        //     ship_country: "Bangladesh",
        //   };

        //   const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        //   sslcz.init(data).then((apiResponse) => {
        //     let GatewayPageURL = apiResponse.GatewayPageURL;
        //     res.send({ url: GatewayPageURL });

        //     const finalOrder = {
        //       product,
        //       paidStatus: false,
        //       tranjectionId: tran_id,
        //     };
        //     ordersCollection.insertOne(finalOrder);
        //     console.log("Redirecting to:", GatewayPageURL);
        //   });
        // });

        app.post("/payment/success/:tranId", async (req, res) => {
            const result = await ordersCollection.updateOne(
                { tranjectionId: req.params.tranId },
                { $set: { paidStatus: true } }
            );
            if (result.modifiedCount > 0) {
                res.redirect(`http://localhost:3000/payment/paymentSuccess`);
            }
        });

        app.post("/payment/fail/:tranId", async (req, res) => {
            const result = await ordersCollection.deleteOne({
                tranjectionId: req.params.tranId,
            });
            if (result.deletedCount) {
                res.redirect(`http://localhost:3000/payment/paymentFail`);
            }
        });

        app.post('/orders', async (req, res) => {
            const orderData = req.body;
            const result = await ordersCollection.insertOne(orderData);
            res.send(result);
        })

        app.get('/cartItems', async (req, res) => {
            const email = req.query.email;
            const filter = {};
            if (email) {
                filter.userEmail = email;
            }
            const result = await cartItemsCollection.find(filter).toArray();
            res.send(result);
        })


        app.post('/addToCart', async (req, res) => {
            const cartItem = req.body;
            const result = await cartItemsCollection.insertOne(cartItem);
            res.send(result);
        })
        app.delete("/cartItems/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await cartItemsCollection.deleteOne(query);
            res.send(result);
        });
        console.log("✅ MongoDB connected successfully!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// ✅ Start Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
