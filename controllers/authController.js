const { hash, verify } = require('node-php-password');
const { generateToken } = require('../utils/tokenGenerators');
const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { v4: uuidv4 } = require('uuid');
const { formatDate } = require('../utils/formatDate');
const { userRole } = require('../utils/userRole');
const { checkPassword } = require('../utils/checkPassword');
const { checkEmail } = require('../utils/checkEmail');

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
                    user_enabled: 'true',
                    add_date: formatDate(new Date()),
                },
            });

            adminDetail = newAdmin;
        }
        
        // Register the admin in group_user
        const adminRegister = await prisma.v_user_groups.create({
            data: {
                user_group_uuid: uuidv4(),
                domain_uuid: defaultDomain.domain_uuid,
                group_name: adminInfo.group_name,
                group_uuid: adminInfo.group_uuid,
                user_uuid: adminDetail.user_uuid,
            }
        })
    
        // Get the tokens
        const token = await generateToken(adminDetail);
    
        return res.status(resCode.SUCCESS).json({ token });
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
    
        return res.status(resCode.SUCCESS).json({ token });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}