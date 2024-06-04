const { hash, verify } = require('node-php-password');
const { generateToken, generateVerifyToken, verifyToken } = require('../utils/tokenGenerators');
const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { v4: uuidv4 } = require('uuid');
const { userRole } = require('../utils/userRole');
const { checkPassword } = require('../utils/checkPassword');
const { checkEmail } = require('../utils/checkEmail');
const { verifyEmailTemplate } = require('../utils/verifyEmailTemplate');
const nodemailer = require('nodemailer');

exports.adminResendEmail = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (isEmpty(user_id))
            return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        const adminDetail = await prisma.v_users.findUnique({ where: { user_uuid: user_id } });

        const accessToken = await generateToken(adminDetail);

        let mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ginik0108@gmail.com',
                pass: 'rdhokxbadyfuilyf'
            }
        });
    
        const verifyToken = await generateVerifyToken(adminDetail);

        if (isEmpty(verifyToken)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
    
        let mailDetails = {
            from: 'tonionestar1004@gmail.com',
            to: adminDetail.user_email,
            subject: 'Email Verify Test',
            html: verifyEmailTemplate(adminDetail.username, process.env.VERIFY_EMAIL_BASE_LINK
                + `?verify=${verifyToken}` + `?user_uuid=${adminDetail.user_uuid}`),
        };
    
        mailTransporter.sendMail(mailDetails, (err, data) => {
            if (err) {
                console.log('Error Occurs', err);
                return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    } 
}

exports.adminVerify = async (req, res) => {
    try {
        const { verify, user_id } = req.body;

        if (isEmpty(verify) && isEmpty(user_id))
            return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });

        const decoded = await verifyToken(verify);

        if (decoded && user_id != decoded.id)
            return res.status(resCode.BAD_REQUEST).json({ msg: resMessage.BAD_REQUEST });

        const userData = await prisma.view_users.findUnique({ where: { user_uuid: decoded.id } });
        const userEmail = await prisma.v_users.update({ 
            where: { user_uuid: decoded.id },
            data: { user_enabled: 'true' },
        });
        
        if (isEmpty(userData) && isEmpty(userEmail))
            return res.status(resCode.UNREGISTER_USER).json({ msg: resMessage.UNREGISTER_USER });
        
        userData.user_email = userEmail.user_email;
        const accessToken = await generateToken(userData);

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { token: accessToken, admin: userData } });

        
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.adminRegister = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;
    
        // Simple validation
        if (isEmpty(username) || isEmpty(email) || isEmpty(password))
            return res.status(resCode.NO_EXIST).json({ msg: resMessage.CHECK_ALL_FIELD });
        
        if (!checkEmail(email)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_EMAIL });
        if (!checkPassword(password)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_PASSWORD });
    
        // Check if the admin exists
        const admin = await prisma.v_users.findFirst({ where: { user_email: email } });

        let adminDetail;

        //Get default domain info
        const defaultDomain = await prisma.v_domains.findFirst({ where: { domain_name: process.env.DEFAULT_DOMAIN } });
    
        // Get user info in group
        const adminInfo = await prisma.v_groups.findFirst({ where: { group_name: 'admin' } });
        
        if (admin){
            const adminDetails = await prisma.view_users.findMany({ where: { user_uuid: admin.user_uuid } });
            
            adminDetails.forEach(admin => {
                if (admin.group_level > userRole.ADMIN - 1) {
                    return res.status(resCode.ALREADY_EXIST).json({ msg: resMessage.ALREADY_EXIST });
                } else {
                    adminDetail = admin;
                }
            });
        } else {
            // Create a new contact
            const newContact = await prisma.v_contacts.create({
                data: {
                    contact_uuid: uuidv4(),
                    contact_type: 'user',
                    domain_uuid: defaultDomain.domain_uuid,
                    contact_name_family: firstName,
                    contact_name_given: lastName,
                },
            });

            // Create a new admin
            const newAdmin = await prisma.v_users.create({
                data: {
                    user_uuid: uuidv4(),
                    username: username,
                    domain_uuid: defaultDomain.domain_uuid,
                    user_email: email,
                    password: await hash(password, process.env.PASSWORD_DEFAULT, { cost: 10 }),
                    contact_uuid: newContact.contact_uuid,
                    user_enabled: 'false',
                    add_date: new Date(),
                },
            });

            adminDetail = newAdmin;
        }

        if (adminDetail) {
            
            // Register the admin in group_user
            const adminRegister = await prisma.v_user_groups.create({
                data: {
                    user_group_uuid: uuidv4(),
                    domain_uuid: defaultDomain.domain_uuid,
                    group_name: adminInfo.group_name,
                    group_uuid: adminInfo.group_uuid,
                    user_uuid: adminDetail.user_uuid,
                }
            });

            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ginik0108@gmail.com',
                    pass: 'rdhokxbadyfuilyf'
                }
            });
        
            const verifyToken = await generateVerifyToken(adminDetail);

            if (isEmpty(verifyToken)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
        
            let mailDetails = {
                from: 'tonionestar1004@gmail.com',
                to: adminDetail.user_email,
                subject: 'Email Verify Test',
                html: verifyEmailTemplate(adminDetail.username, process.env.VERIFY_EMAIL_BASE_LINK
                    + `?verify=${verifyToken}` + `?user_uuid=${adminDetail.user_uuid}`),
            };
        
            mailTransporter.sendMail(mailDetails, (err, data) => {
                if (err) {
                    console.log('Error Occurs', err);
                    return res.status(resCode.NO_EXIST).json({ msg: resMessage.NO_EXIST });
                }
            });
        
            return res.status(resCode.SUCCESS).json({ msg: `Verify email was sent your email(${adminDetail.user_email})` });
        }
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
    
        // Admin input validation
        if (isEmpty(email) || isEmpty(password))
            return res.status(resCode.NO_EXIST).json({ msg: resMessage.CHECK_ALL_FIELD });

        if (!checkEmail(email)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.NOT_EMAIL });
        if (!checkPassword(password)) return res.status(resCode.NO_EXIST).json({ msg: resMessage.PASSWORD_SHORT });
    
        // Get the admin
        const admin = await prisma.v_users.findFirst({ where: { user_email: email } });
        
        if (!admin) return res.status(resCode.UNREGISTER_USER).json({ msg: resMessage.UNREGISTER_USER });
        if (admin.user_enabled !== 'true') return res.status(resCode.USER_IS_BANNED).json(resMessage.USER_IS_BANNED);
        
        const adminDetail = await prisma.view_users.findUnique({ where: { user_uuid: admin.user_uuid } });

        if (adminDetail.group_level < userRole.ADMIN - 1) return res.status(resCode.NO_PERMISSION).json({ msg: resMessage.NO_PERMISSION });
    
        // Validate password
        const isMatch = await verify(password, admin.password);
    
        if (!isMatch)
            return res.status(resCode.CURRENT_PASSWORD_INCORRECT).json({ msg: resMessage.CURRENT_PASSWORD_INCORRECT });
    
        // Generate a token
        const token = await generateToken(admin);
    
        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: { admin: adminDetail, token } });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}
