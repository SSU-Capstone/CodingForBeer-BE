const Group = require('../models/Group');
const yorkie = require('yorkie-js-sdk');
const crypto = require('crypto');


const create_group = async (req, res) => 
{
    console.log(req.isAuthenticated());
    // if(!req.isAuthenticated())
    // {
    //     return res.status(401).json({ error : "Not Authenticated"});
    // }
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
    // if(!req.isAuthenticated())
    // {
    //     return res.status(401).json({ error : "Not Authenticated"});
    // }
    //  const { group_id, document_id } = req.body;
    const group_name = req.params.group_name; // < 59
    const document_name = req.body.document_name; // < 60
    document_key = group_name + '-' + document_name;

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

        return res.status(201).json({document : document_key});
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}
const get_groups = async (req,res) =>
{
    // if(!req.isAuthenticated())
    // {
    //     return res.status(401).json({ error : "Not Authenticated"});
    // }

    try {
        const groups = await Group.find({ users: req.user.id});
        const group_names = groups.map(group => group.name);
        return res.json(group_names);
    } catch (error) 
    {
        console.error("error fetching group list",error);
        res.status(500).json({ error : "failed to fetch group list"});
    }
}

const get_documents = async (req,res) =>
{
    // if(!req.isAuthenticated())
    // {
    //     return res.status(401).json({error : "Not Authenticated"});
    // }

    try {
        const group_name = req.params.group_name;
        console.log(group_name);
        const group = await Group.find({ name : group_name });
        console.log(group);
        const documents= group[0].documents;
        console.log(documents);
        return res.json({document : documents});
    } catch (err) {
        console.error("error fetching documents list",err);
        res.status(500).json({ error : "failed to fetch document list of the group"});
    }
}

const generate_token = async (req, res) => {
    // if (!req.isAuthenticated()) {
    //     return res.status(401).json({ error: "Not Authenticated" });
    // }

    const groupName = req.params.group_name;

    try {
        const group = await Group.findOne({ name: groupName });
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Generate a unique invite token
        const inviteToken = crypto.randomBytes(16).toString('hex');

        // Save the token in the group document
        group.inviteToken = inviteToken;
        await group.save();

        // Construct the invite link
        const inviteLink = `${req.protocol}://${req.get('host')}/groups/invite/${inviteToken}`;

        return res.status(200).json({ message: "Invite link generated", inviteLink });
    } catch (error) {
        console.error("Error generating invite link:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const add_user_to_group = async (req, res) => {
    // if (!req.isAuthenticated()) {
    //     return res.status(401).json({ error: "Not Authenticated" });
    // }

    const inviteToken = req.params.token;

    try {
        const group = await Group.findOne({ inviteToken });
        if (!group) {
            return res.status(404).json({ error: "Invalid or expired invite link" });
        }

        const userId = req.user.id; // Assuming `req.user` contains the authenticated user ID

        if (group.users.includes(userId)) {
            return res.status(400).json({ error: "User is already a member of the group" });
        }

        // Add user to the group
        group.users.push(userId);

        // Optionally, invalidate the invite token to make it one-time use
        group.inviteToken = null;

        await group.save();

        return res.status(200).json({ message: "User added to the group", group });
    } catch (error) {
        console.error("Error processing invite link:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { create_group, create_document, get_groups, get_documents,
    add_user_to_group
};
