const { hash } = require('node-php-password');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { userRole } = require('../utils/userRole');
const { checkPassword } = require('../utils/checkPassword');
const { checkEmail } = require('../utils/checkEmail');
const { checkDomain } = require('../utils/checkDomain');

exports.userList = async (req, res) => {
    const query = req.query.search;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize);
    const user = req.user;

    let users;
    let totalUsers;

    try {
        if (isEmpty(query)) {
            users = await prisma.view_users.findMany({
                where: {
                    AND: [
                        { user_uuid: { not: user.user_uuid } },
                        // { user_enabled: {equals: 'true'} },
                    ],
                    OR: [
                    {group_level: { lt: user.group_level + 1 }},
                    {group_level: { equals: null }},
                    ],
                }, skip, take,
            });

            totalUsers = await prisma.view_users.findMany({
                where: {
                    AND: [
                        { user_uuid: { not: user.user_uuid } },
                        // { user_enabled: {equals: 'true'} },
                    ],
                    OR: [
                    {group_level: { lt: user.group_level + 1 }},
                    {group_level: { equals: null }},
                    ],
                },
            });
        } else {
            users = await prisma.view_users.findMany({
                where: {
                    AND: [
                        { user_uuid: { not: user.user_uuid } },
                        // { user_enabled: {equals: 'true'} },
                    ],
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { contact_name: { contains: query, mode: 'insensitive' } },
                        { group_names: { contains: query, mode: 'insensitive' } },
                        { group_level: { equals: user.group_level + 1 } },
                    ],
                },
                skip,
                take,
            });

            totalUsers = await prisma.view_users.findMany({
                where: {
                    AND: [
                        { user_uuid: { not: user.user_uuid } },
                        // { user_enabled: {equals: 'true'} },
                    ],
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { contact_name: { contains: query, mode: 'insensitive' } },
                        { group_names: { contains: query, mode: 'insensitive' } },
                        { group_level: { equals: user.group_level + 1 } },
                    ],
                },
            });
        }

        const totalCount = totalUsers.length;
        const totalPages = Math.ceil(totalCount / take);

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { users, totalCount, totalPages, page, pageSize } });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.userCreate = async (req, res) => {
    // const languages = await prisma.v_languages.findMany({ distinct: ['language', 'code'] });
    // const timeZones = await prisma.v_countries.findMany({ distinct: ['country', 'iso_a2', 'iso_a3', 'num', 'country_code'] });

    let groups;
    let domains;

    try {
        groups = await prisma.view_groups.findMany({ where: { group_level: { lt: userRole.ADMIN + 1 } } });
        domains = await prisma.v_domains.findMany({ where: { domain_enabled: true } });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
    
    if (req.method == 'GET') {
        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { groups, domains } });
    } else if (req.method == 'POST') {
        try {
            const {
                username,
                firstName,
                lastName,
                password,
                email,
                organization,
                group = '5d0f9ba9-f9cd-4ff1-9004-1021139cb99e',
                domain = 'cb581edd-928d-42ee-a5c2-d28997b5842e',
            } = req.body;

            const admin = req.user;
            let userDomain = null;
            let userGroup = null;
    
            if (isEmpty(username)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.REQUIRE_NAME });
            if (!checkEmail(email)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_EMAIL });
            if (!checkPassword(password)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_PASSWORD });
    
            const user = await prisma.v_users.findFirst({ where: { user_email: email } });
            if (!isEmpty(user)) return res.status(resCode.ALREADY_EXIST).json({ msg: resMessage.ALREADY_EXIST });
            
            if (!isEmpty(domain)) {
                userDomain = await prisma.v_domains.findUnique({ where: { domain_uuid: domain } });
                if (isEmpty(userDomain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UNREGISTER_DATA });
            }
                
            const newContact = await prisma.v_contacts.create({
                data: {
                    contact_uuid: uuidv4(),
                    contact_type: 'user',
                    domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
                    contact_name_family: firstName ? firstName : null,
                    contact_name_given: lastName ? lastName : null,
                    contact_organization: organization ? organization : null,
                    insert_date: new Date(),
                    insert_user: admin.user_uuid,
                },
            });
            if(isEmpty(newContact)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.CREATE_FAILED });

            const newUser = await prisma.v_users.create({
                data: {
                    user_uuid: uuidv4(),
                    domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
                    contact_uuid: newContact.contact_uuid,
                    username: username,
                    user_enabled: 'true',
                    user_email: email,
                    password: hash(password, process.env.PASSWORD_DEFAULT, { cost: 10 }),
                    insert_user: admin.user_uuid,
                    insert_date: new Date(),
                },
            })
            if(isEmpty(newUser)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.CREATE_FAILED });

            if (!isEmpty(group)) {
                const groupDetail = await prisma.v_groups.findUnique({ where: { group_uuid: group } });
                if (isEmpty(groupDetail)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.CREATE_FAILED });

                userGroup = await prisma.v_user_groups.create({
                    data: {
                        user_group_uuid: uuidv4(),
                        domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
                        group_name: groupDetail.group_name,
                        group_uuid: groupDetail.group_uuid,
                        user_uuid: newUser.user_uuid,
                        insert_user: admin.user_uuid,
                        insert_date: new Date(),
                    }
                });
                if(isEmpty(userGroup)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.CREATE_FAILED });
            }

            return res.status(resCode.CREATED).json({ msg: resMessage.CREATED });
        } catch (err) {
            console.log(err);
            return res.status(resCode.SERVER_ERROR).json({ msg: err });
        }
    }
}

exports.userUpdate = async (req, res) => {
    const { id } = req.params;
    if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

    const user = await prisma.view_users.findUnique({ where: { user_uuid: id } });
    if (isEmpty(user)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
    
    const userDetail = await prisma.v_users.findUnique({ where: { user_uuid: id } });
    if (isEmpty(userDetail)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

    user.user_email = userDetail.user_email;
    let groups;
    let domains;

    try {
        groups = await prisma.view_groups.findMany({ where: { group_level: { lt: userRole.ADMIN + 1 } } });
        domains = await prisma.v_domains.findMany({ where: { domain_enabled: true } });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
    
    if (req.method == 'GET') {
        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { groups, user, domains } });
    } else if (req.method == 'PUT') {
        try {
            const { username, firstName, lastName, password, email, organization, group, domain } = req.body;
            const admin = req.user;
            let userDomain;

            if (isEmpty(username)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.REQUIRE_NAME });
            if (!checkEmail(email)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_EMAIL });
            if (password)
                if (!checkPassword(password)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_PASSWORD });

            const userCheck = await prisma.v_users.findFirst({ where: { user_email: email } });
            if (userCheck && id !== userCheck.user_uuid) return res.status(resCode.ALREADY_EXIST).json({ msg: resMessage.ALREADY_EXIST });

            if (!isEmpty(domain)) {
                userDomain = await prisma.v_domains.findUnique({ where: { domain_uuid: domain } });
                if(isEmpty(userDomain) && userDomain.domain_enabled == false)
                    return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED })
            }

            const updateData = {
                username: username,
                update_user: admin.user_uuid,
                update_date: new Date(),
                user_email: email,
                domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
            };

            if (password) updateData.password = hash(password, process.env.PASSWORD_DEFAULT, { cost: 10 });

            let updateUser = await prisma.v_users.update({
                where: { user_uuid: id },
                data: updateData,
            });
            if(isEmpty(updateUser)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED });

            const updateContact = await prisma.v_contacts.update({
                where: { contact_uuid: updateUser.contact_uuid },
                data: {
                    domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
                    contact_name_family: firstName ? firstName : null,
                    contact_name_given: lastName ? lastName : null,
                    contact_organization: organization ? organization : null,
                    update_date: new Date(),
                    update_user: admin.user_uuid,
                },
            });
            if(isEmpty(updateContact)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED });

            if (!isEmpty(group)) {
                // JSON.parse(groups).forEach(async (group) => {
                const groupDetail = await prisma.v_groups.findUnique({ where: { group_uuid: group } });
                if (isEmpty(groupDetail)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED });

                const removeUserGroup = await prisma.v_user_groups.deleteMany({
                    where: { user_uuid: id,
                        // AND: [
                        //     { group_uuid: { equals: group } },
                        //     { user_uuid: { equals: id } },
                        // ]
                    }
                });
        
                const registUserGroup = await prisma.v_user_groups.create({
                    data: {
                        user_group_uuid: uuidv4(),
                        domain_uuid: isEmpty(userDomain) ? null : userDomain.domain_uuid,
                        group_name: groupDetail.group_name,
                        group_uuid: groupDetail.group_uuid,
                        user_uuid: id,
                        insert_user: admin.user_uuid,
                        insert_date: new Date(),
                    }
                });

                updateUser = await prisma.view_users.findUnique({ where: {user_uuid: id} });
                const update = await prisma.v_users.findUnique({ where: {user_uuid: id} });

                updateUser.user_email = update.user_email;
                // });
            }

            return res.status(resCode.CREATED).json({ msg: resMessage.UPDATED, data: updateUser });
        } catch (err) {
            console.log(err);
            return res.status(resCode.SERVER_ERROR).json({ msg: err });
        }
    }
}

exports.userRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const user = await prisma.view_users.findUnique({ where: { user_uuid: id } });

        if (isEmpty(user)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
        
        const userDetail = await prisma.v_users.findUnique({ where: { user_uuid: id } });

        if (isEmpty(userDetail)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        user.user_email = userDetail.user_email;

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: user });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.userSetStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = req.user;
        
        if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const user = await prisma.v_users.findUnique({ where: { user_uuid: id } });
        if(isEmpty(user)) return res.json(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        const deleteUser = await prisma.v_users.update({
            where: { user_uuid: id },
            data: {
                user_enabled: user.user_enabled == 'true' ? 'false' : 'true',
                update_date: new Date(),
                update_user: admin.user_uuid,
            }
        });

        if (isEmpty(deleteUser)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED });

        return res.status(resCode.SUCCESS).json({ msg: resMessage.UPDATED });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.domainList = async (req, res) => {
    const query = req.query.search;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize);

    let domains;
    let totalDomains;

    try {
        if (isEmpty(query)) {
            domains = await prisma.v_domains.findMany({ skip, take });

            totalDomains = await prisma.v_domains.findMany({ where: { domain_enabled: true } });
        } else {
            domains = await prisma.v_domains.findMany({
                where: {
                    OR: [
                        { domain_name: { contains: query, mode: 'insensitive' } },
                        { domain_description: { contains: query, mode: 'insensitive' } },
                    ],
                },
                skip,
                take,
            });

            totalDomains = await prisma.v_domains.findMany({
                where: {
                    AND: [{ domain_enabled: { equals: true } }],
                    OR: [
                        { domain_name: { contains: query, mode: 'insensitive' } },
                        { domain_description: { contains: query, mode: 'insensitive' } },
                    ],
                },
            });
        }

        const totalCount = totalDomains.length;
        const totalPages = Math.ceil(totalCount / take);

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { domains, totalCount, totalPages, page, pageSize } });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.domainCreate = async (req, res) => {
    try {
        const { domain_name, domain_description } = req.body;
        const user = req.user;

        if (isEmpty(domain_name)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.REQUIRE_NAME });
        if (!checkDomain(domain_name)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_DOMAIN });

        const domain = await prisma.v_domains.findFirst({ where: { domain_name: domain_name } });

        if (!isEmpty(domain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.ALREADY_EXIST });

        const newDomain = await prisma.v_domains.create({
            data: {
                domain_name: domain_name,
                domain_description: domain_description ? domain_description : null,
                domain_enabled: true,
                insert_user: user.user_uuid,
                insert_date: new Date()
            }
        });

        if (isEmpty(newDomain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.CREATE_FAILED });

        return res.status(resCode.CREATED).json({ msg: resMessage.CREATED });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.domainRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const domain = await prisma.v_domains.findUnique({ where: { domain_uuid: id } });

        if (isEmpty(domain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: domain });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.domainUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const domain = await prisma.v_domains.findUnique({ where: { domain_uuid: id } });

        if (isEmpty(domain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
        
        if (req.method == 'GET') {
            return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: domain });
        } else if (req.method == 'PUT') {
            const { domain_name, domain_description } = req.body;

            if (!checkDomain(domain_name)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_DOMAIN });

            const domain = await prisma.v_domains.findFirst({
                where: {
                    AND: [
                        { domain_name: { equals: domain_name, mode: 'default' } },
                        { domain_uuid: { not: id, mode: 'default' } },
                    ],
                },
            });

            if (!isEmpty(domain)) return res.status(resCode.ALREADY_EXIST).json({ msg: resMessage.ALREADY_EXIST });

            const newDomain = await prisma.v_domains.update({
                where: { domain_uuid: id },
                data: {
                    domain_name: domain_name,
                    domain_description: domain_description ? domain_description : null,
                    update_date: new Date(),
                    update_user: user.user_uuid,
                },
            });

            if (isEmpty(newDomain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.UPDATE_FAILED });

            return res.status(resCode.SUCCESS).json({ msg: resMessage.UPDATED, data: newDomain });
        }
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.domainSetStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (isEmpty(id)) return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const domain = await prisma.v_domains.findUnique({ where: { domain_uuid: id } });

        if (isEmpty(domain)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        const updateDomainStatus = await prisma.v_domains.update({
            where: { domain_uuid: id },
            data: {
                domain_enabled: !domain.domain_enabled,
                update_date: new Date(),
                update_user: user.user_uuid,
            },
        });

        if (isEmpty(updateDomainStatus))
            return res.status(resCode.NO_EXIST).json({ msg: resMessage.SETEDSTATUS_FAILED });

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SETEDSTATUS, data: updateDomainStatus });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}