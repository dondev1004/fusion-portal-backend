require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { prisma } = require('./utils/prisma');
const routes = require('./routes');
const {resCode, resMessage} = require('./utils/resCode');

const PORT = process.env.PORT || 3000;
const app = express();

async function main() {
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    /* Routes */
    app.use("/api/", routes);

    /* Catch all route */
    app.use("*", (req, res) => {
        res.status(resCode.NO_EXIST).json({ error: resMessage.NO_EXIST });
    });

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

main()
  .then(async () => {
    await prisma.$connect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

