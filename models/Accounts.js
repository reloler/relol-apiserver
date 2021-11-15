module.exports = (sequelize, DataTypes) => {
  var Accounts = sequelize.define('Accounts', {
    accountId: {
      primaryKey: true,
      type: DataTypes.STRING,
      allowNull: false,
      comment: '유저 구글 ID',
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '액세스 토큰'
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '리프레시 토큰',
    },
    messageToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '푸시 메시지 토큰'
    },
    point: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '유저 포인트'
    }
  },
    {
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

  return Accounts;
};
