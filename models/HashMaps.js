module.exports = (sequelize, DataTypes) => {
    var HashMaps = sequelize.define('HashMaps', {
        key: {
            primaryKey: true,
            type: DataTypes.STRING,
            allowNull: false,
            comment: '키',
        },
        value: {
            allowNull: false,
            type: DataTypes.STRING,
            comment: '값',
        }
      },
      {
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  
    return HashMaps;
  };
  