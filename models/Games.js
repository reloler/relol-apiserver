module.exports = (sequelize, DataTypes) => {
    var Games = sequelize.define('Games', {
        gameId: {
            primaryKey: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '게임 ID',
        },
        gameData: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '게임 JSON 데이터',
        },
        timelineData: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '타임라인 JSON 데이터',
        },
        timestamp: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '게임 시작 시각',
        }
    });

    return Games;
}