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
    }
});

async function run() {
    try {

        const database = client.db('smartShop');
        const productsCollection = database.collection('products');
        const cartItemsCollection = database.collection('cartItems');

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
        })
        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;  // params থেকে id নিলাম
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


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }

    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
