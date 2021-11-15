module.exports = (sequelize, DataTypes) => {
    var Authentications = sequelize.define('Authentications', {
        deviceId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            comment: '기기고유식별자',
        },
        deviceSecret: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: '기기 비밀번호',
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: 'false: 미인증, true: 인증',
        },
        accountId: {
            type: DataTypes.STRING(56),
            allowNull: false,
            comment: '유저 고유 ID',
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });

    return Authentications;
}