module.exports = (sequelize, DataTypes) => {
    var Users = sequelize.define('Users', {
        accountId: {
            primaryKey: true,
            type: DataTypes.STRING(56),
            allowNull: false,
            comment: '유저 고유 ID',
        },
        nickname: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '유저 닉네임',
        },
        icon: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '유저 아이콘 ID',
        },
        level: {
            type:DataTypes.INTEGER,
            allowNull: true,
            comment: '유저 레벨',
        },
        gameList: {
            type:DataTypes.JSON,
            allowNull: true,
            comment: '유저 최근 게임 목록',
        },
        renewAt: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: '게임 목록 갱신 날짜'
        }
      },
      {
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  
    return Users;
  };
  