const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { userRole } = require('../utils/userRole');

exports.userList = async (req, res) => {
    const query = req.query.search;
    let users;

    try {
        if (isEmpty(query)) {
            users = await prisma.view_users.findMany({
                where: { group_level: { lt: userRole.ADMIN + 1 } }
            });
        } else {
            users = await prisma.view_users.findMany({
                where: {
                    AND: [{ group_level: { lt: userRole.ADMIN + 1 } }],
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { contact_name: { contains: query, mode: 'insensitive' } },
                        { group_names: { contains: query, mode: 'insensitive' } },
                    ]
                },
            })
        }

        return res.status(resCode.SUCCESS).json({ msg: resMessage.SUCCESS, data: users });
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}

exports.userCreate = async (req, res) => {
    if (req.method == 'GET') {
    } else if (req.method == 'POST') {
    }
}
