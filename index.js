const express = require('express')
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 5000


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

async function run() {
    try {

        const database = client.db('smartShop');
        const productsCollection = database.collection('products');
        const cartItemsCollection = database.collection('cartItems');
        const usersCollection = database.collection("users")

        app.get('/products', async (req, res) => {
            const { category, name, id } = req.query;
            const filter = {};

            if (category) {
                filter.category = category;
            }
            if (name) {
                filter.name = { $regex: name, $options: 'i' };
            }
            if (id) {
                filter._id = new ObjectId(id);
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;
            const result = await productsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get('/cartItems', async (req, res) => {
            const email = req.query.email;
            const filter = {};
            if (email) {
                filter.userEmail = email;
            }
            const result = await cartItemsCollection.find(filter).toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const userData = req.body;

            const existingUser = await usersCollection.findOne({ email: userData.email });
            if (existingUser) {
                return res.status(409).send({ message: 'User already exists' });
            }

            const result = await usersCollection.insertOne(userData);
            res.send(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email });
            res.send(user);
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
                if (!user) return res.status(404).send({ message: "User not found" });
                res.send({ role: user.role });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        app.post('/addToCart', async (req, res) => {
            const cartItem = req.body;
            const result = await cartItemsCollection.insertOne(cartItem);
            res.send(result);
        });

        app.delete("/cartItems/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartItemsCollection.deleteOne(query);
            res.send(result);
        });

        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } 
}  

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
