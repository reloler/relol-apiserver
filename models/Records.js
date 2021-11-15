module.exports = (sequelize, DataTypes) => {
    var Records = sequelize.define('Records', {
        recordData: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '녹화 JSON 데이터',
        },
        recordOwner: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '보유자 구글 ID'
        },
        gameId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '게임 ID',
        },
        playerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '플레이어 역할 번호',
        },  
        recordStatus: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '녹화 진행 상태',
        },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['gameId', 'playerId', 'recordOwner'],
            }
        ],
    });

    return Records;
}