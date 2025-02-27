// models/threadTag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const ThreadTag = sequelize.define('ThreadTag', {
    thread_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'thread_id',
        references: {
            model: 'Threads',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'tag_id',
        references: {
            model: 'Tags',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'ThreadTags',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            fields: ['thread_id']
        },
        {
            fields: ['tag_id']
        }
    ]
});

module.exports = ThreadTag;