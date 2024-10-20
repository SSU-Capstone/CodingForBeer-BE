const Group = require('../models/Group');
const yorkie = require('yorkie-js-sdk');


const add_group = async (leader, group_name) => 
{
    //const { name, users } = req.body; 
    // const leader is leader user id
    // const group_name is the name of the group

    try {
        const new_group = new Group({
        name : group_name,
        users : [leader], 
        });

        await new_group.save(); 
        res.status(201).json(new_group); 
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Error creating group', error });
    }
};

const add_group_document = async (groupId, documentId) =>
{

    //  const { groupId, documentId } = req.body;

    try {
    const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $addToSet: { documents: documentId } }, // $addToSet to avoid duplicates
        { new: true, runValidators: true } // return the updated group and run validators
    );

    if (!updatedGroup) {
        return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(updatedGroup); 
    } catch (error) {
    console.error('Error adding document to group:', error);
    res.status(500).json({ message: 'Error adding document to group', error });
    }
    
}
module.exports = { add_group, add_group_document };
