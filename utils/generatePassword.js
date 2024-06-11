exports.generatePassword = (length = 20, strength = 4) => {
    let password = '';
    let chars = '';

    if (strength >= 1) { chars += "0123456789"; }
    if (strength >= 2) { chars += "abcdefghijkmnopqrstuvwxyz"; }
    if (strength >= 3) { chars += "ABCDEFGHIJKLMNPQRSTUVWXYZ"; }
    if (strength >= 4) { chars += "!^$%*?."; }

    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
}