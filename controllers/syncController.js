const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { default: axios } = require('axios');
const { encryptMd5, encryptSha256 } = require('../utils/encrypt');

const GetGDMSAccessToken = () => {
    return axios.get(`${process.env.GDMS_BASE_URL}/oauth/token`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
            username: process.env.GDMS_USERNAME,
            grant_type: process.env.GRANT_TYPE,
            client_secret: process.env.GDMS_CLIENT_SECRET,
            client_id: process.env.GDMS_CLIENT_ID,
            password: process.env.GDMS_HASH_PASSWORD,
        },
    });
}

const GetGDMSSiteList = (access_token, signature, timestamp, pageSize, pageNum ) => {
    return axios.get(`${process.env.GDMS_BASE_URL}/v1.0.0/org/list`, {
        headers: { 'Content-Type': 'application/json' },
        params: { access_token, signature, timestamp },
    });
}

exports.fusionToGdmsSyncSite = async (req, res) => {
    const tokenData = await GetGDMSAccessToken();
    const accessToken = tokenData.data.access_token;
    let list;
    let i = 1;
    
    do {
        const timestamp = Math.floor(Date.now());

        const signatureObject = {
            access_token: accessToken,
            client_id: process.env.GDMS_CLIENT_ID,
            client_secret:process.env.GDMS_CLIENT_SECRET,
            timestamp: timestamp,
            // pageSize: 1000,
            // pageNum: i,
        };

        // const body = { pageNum: i, pageSize: 1000 };

        const signatureUrl = new URLSearchParams(signatureObject).toString();
        const signature = encryptSha256(`&${signatureUrl}&`);

        console.log(signature);

        list = await GetGDMSSiteList(accessToken, signature, timestamp, 1000, i);

        console.log(list.data);

        i++;
    } while (list.data.data && list.data.data?.result < 1000);

    console.log(i);
}   