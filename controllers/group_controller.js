const Group = require('../models/Group');
const yorkie = require('yorkie-js-sdk');


const create_group = async (req, res) => 
{
    console.log(req.isAuthenticated());
    if(!req.isAuthenticated())
    {
        return res.status(401).json({ error : "Not Authenticated"});
    }
    const leader = req.user.id;
    const group_name = req.body.name;

    try {
        const new_group = new Group({
        name : group_name,
        users : [leader], 
        });

        await new_group.save(); 
        return res.status(201).json(new_group); 
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Error creating group', error });
    }
};

const create_document = async (req,res) =>
{
    console.log(req.isAuthenticated());
    if(!req.isAuthenticated())
    {
        return res.status(401).json({ error : "Not Authenticated"});
    }
    //  const { group_id, document_id } = req.body;
    const group_name = req.params.group_name; // < 59
    const document_name = req.body.document_name; // < 60
    document_key = group_name + '_' + document_name;

    try {
        const group = await Group.findOne({ name : group_name });

        if (!group) 
        {
            return res.status(404).send("Group not found");
        }
        if (!group.users.includes(req.user.id))
        {
            return res.status(401).json({ error : "Not Authorized User"});
        }

        if(group.documents.includes(document_name))
        {
            return res.status(409).send("Document name already exists");
        }

        const client = new yorkie.Client(process.env.YORKIE_URI);
        await client.activate();
        const doc = new yorkie.Document(document_key);
        await client.attach(doc, { initialPresence: {} });
        await client.detach(doc);

        group.documents.push(document_name);
        await group.save();

        return res.status(201).send(document_key);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}
const get_groups = async (req,res) =>
{
    if(!req.isAuthenticated())
    {
        return res.status(401).json({ error : "Not Authenticated"});
    }

    try {
        const groups = await Group.find({ users: req.user.id});
        const group_names = group.map(group => group.name);
        return res.json(group_names);
    } catch (error) 
    {
        console.error("error fetching group list",error);
        res.status(500).json({ error : "failed to fetch group list"});
    }
}

const get_documents = async (req,res) =>
{
    if(!req.isAuthenticated())
    {
        return res.status(401).json({error : "Not Authenticated"});
    }

    try {
        const group_name = req.params.group_name;
        const group = await Group.find({ name : group_name});
        const documents= group.documents;
        return res.json(documents);
    } catch (err) {
        console.error("error fetching documents list",err);
        res.status(500).json({ error : "failed to fetch document list of the group"});
    }
}
module.exports = { create_group, create_document, get_groups, get_documents};
