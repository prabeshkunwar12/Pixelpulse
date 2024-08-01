module.exports = (sequelize, DataTypes) => {
  const WristbandTran = sequelize.define('WristbandTran', {
    WristbandTranID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    src: {
      type: DataTypes.STRING(50),
    },
    wristbandCode: {
      type: DataTypes.STRING(200),
    },
    PosBookingid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    WristbandTranDate: {
      type: DataTypes.DATE,
    },
    wristbandStatusFlag: {
      type: DataTypes.STRING(1),
    },
    CreatedDate: {
      type: DataTypes.DATE,
    },
    playerStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    playerEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    GameroomTypeId: {
      type: DataTypes.INTEGER,
    },
    updateDateTime: {
      type: DataTypes.DATE,
    },
  });
  
  WristbandTran.associate = (models) => {
    WristbandTran.belongsTo(models.Player, { foreignKey: 'playerID', as: 'player' });
  };

  return WristbandTran;
};
