const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { default: axios } = require('axios');
const { encryptMd5, encryptSha256 } = require('../utils/encrypt');
const { v4: uuidv4 } = require('uuid');
const { param } = require('../routes/adminRoutes');

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

const GetGDMSSiteList = (access_token, signature, timestamp ) => {
    return axios.get(`${process.env.GDMS_BASE_URL}/v1.0.0/site/list`, {
        headers: { 'Content-Type': 'application/json' },
        params: { access_token, timestamp, signature },
    });
}

const fusionToGdmsSyncSite = async (req, res) => {
    try {
        const user = req.user;
        const tokenData = await GetGDMSAccessToken();
        const accessToken = tokenData.data.access_token;
        let timestamp = Math.floor(Date.now());
    
        const signatureObject = {
            access_token: accessToken,
            client_id: process.env.GDMS_CLIENT_ID,
            client_secret:process.env.GDMS_CLIENT_SECRET,
            timestamp: timestamp,
        };
    
        let signatureUrl = new URLSearchParams(signatureObject).toString();
        let signature = encryptSha256(`&${signatureUrl}&`);
    
        const GDMSSiteList = await GetGDMSSiteList(accessToken, signature, timestamp);
        if (isEmpty(GDMSSiteList.data.data))
            return res.status(resCode.NO_EXIST).json({ msg: resCode.NO_EXIST });

        const domainList = await prisma.v_domains.findMany();
        if (isEmpty(domainList)) return res.status(resCode.NO_EXIST).json({ msg: resCode.NO_EXIST });

        const filteredDomains = domainList.filter(domain =>
            !GDMSSiteList.data.data.result.some(site => 
                domain.domain_name === site.siteName && domain.domain_description === site.description
            ));

        const filteredSites = GDMSSiteList.data.data.result.filter(site =>
            !domainList.some(domain => 
                domain.domain_name === site.siteName && domain.domain_description === site.description
            ));
        
        timestamp = Math.floor(Date.now());
        signatureObject.timestamp = timestamp;

        signatureUrl = new URLSearchParams(signatureObject).toString();
        signature = encryptSha256(`&${signatureUrl}&`);

        filteredDomains.forEach(async domain => {
            let isInclude = false;
            filteredSites.forEach(async site => {
                if (domain.domain_name == site.siteName) {
                    isInclude = true;
                    let editSite = await editGDMSSite(accessToken, timestamp, {
                        id: site.id,
                        siteName: domain.domain_name,
                        siteDesc: domain.domain_description,
                    });

                    if (isEmpty(editSite.data.data))
                        return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
                }
            });
            
            if (!isInclude) {
                let addSite = await addGDMSSite(accessToken, timestamp, { siteName: domain.domain_name, siteDesc: domain.domain_description });
                if (isEmpty(addSite.data.data))
                    return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
            }

        });

        filteredSites.forEach(async site => {
            let isInclude = true;
            filteredDomains.forEach(async domain => {
                if (domain.domain_name == site.siteName) {
                    isInclude = true;
                    let editDomain = await prisma.v_domains.update({
                        where: { domain_uuid: domain.domain_uuid },
                        data: {
                            domain_description: site.description,
                            update_date: new Date(),
                            update_user: user.user_uuid,
                        },
                    })

                    if (isEmpty(editDomain))
                        return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
                }
            });

            if (!isInclude) {
                let addDomain = await prisma.v_domains.create({
                    data: {
                        domain_uuid: uuidv4(),
                        domain_name: site.siteName,
                        domain_description: site.siteDesc,
                        insert_user: user.user_uuid,
                        insert_date: new Date(),
                        domain_enabled: true,
                    }
                })
                if (isEmpty(addDomain))
                    return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
            }
        });

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS });

    } catch (err) {
        console.log(err);
        return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
    }
}

const addGDMSSite = (accessToken, timestamp, data) => {
    const params = {
        access_token: accessToken,
        client_id: process.env.GDMS_CLIENT_ID,
        client_secret: process.env.GDMS_CLIENT_SECRET,
        timestamp: timestamp,
    };

    const signatureUrl = new URLSearchParams(params).toString();
    const signature = encryptSha256(`&${signatureUrl}&${encryptSha256(JSON.stringify(data))}&`);
    params.signature = signature;

    return axios.post(`${process.env.GDMS_BASE_URL}/v1.0.0/site/add`, data, {
        headers: {
            'Content-Type': 'application/json',
        },
        params: params
    });
}

const editGDMSSite = (accessToken, timestamp, data) => {
    const params = {
        access_token: accessToken,
        client_id: process.env.GDMS_CLIENT_ID,
        client_secret: process.env.GDMS_CLIENT_SECRET,
        timestamp: timestamp,
    };

    const signatureUrl = new URLSearchParams(params).toString();
    const signature = encryptSha256(`&${signatureUrl}&${encryptSha256(JSON.stringify(data))}&`);
    params.signature = signature;

    return axios.post(`${process.env.GDMS_BASE_URL}/v1.0.0/site/edit`, data, {
            headers: { 'Content-Type': 'application/json' },
            params: params,
        },
    );
}

const deleteGDMSSite = (id) => {
    return axios.post(`${process.env.GDMS_BASE_URL}/v1.0.0/site/delete`,
        { headers: { 'Content-Type': 'application/json' } }, { data: { id } },
    );
}

module.exports = {
    fusionToGdmsSyncSite,
    GetGDMSAccessToken,
    GetGDMSSiteList,
    addGDMSSite,
    editGDMSSite,
    deleteGDMSSite,
}