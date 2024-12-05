const Group = require('../models/Group');
const yorkie = require('yorkie-js-sdk');
const crypto = require('crypto');


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
    if(!req.isAuthenticated())
    {
        return res.status(401).json({ error : "Not Authenticated"});
    }

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
    if(!req.isAuthenticated())
    {
        return res.status(401).json({error : "Not Authenticated"});
    }

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
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not Authenticated" });
    }

    const groupName = req.params.group_name;

    try {
        const group = await Group.findOne({ name: groupName });
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const inviteToken = crypto.randomBytes(16).toString('hex');

        group.inviteToken = inviteToken;
        await group.save();


        const inviteLink = `https://${req.get('host')}/backend/api/groups/invite/${inviteToken}`;

        return res.status(200).json({ message: "Invite link generated", inviteLink });
    } catch (error) {
        console.error("Error generating invite link:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const add_user_to_group = async (req, res) => {
    const inviteToken = req.params.token;

    try {
        if (!req.isAuthenticated()) {
            // Redirect to Google OAuth with `next` query parameter to preserve invite token
            return res.redirect(`/auth/google?next=/api/groups/invite/${inviteToken}`);
        }

        // Validate the invite token
        const group = await Group.findOne({ inviteToken });
        if (!group) {
            return res.status(404).send("Invalid or expired invite link");
        }

        // Check if user is already a member of the group
        const userId = req.user.id;
        if (group.users.includes(userId)) {
            return res.status(400).send("You are already a member of this group");
        }

        // Add user to the group
        group.users.push(userId);
        group.inviteToken = null;  // Optional: invalidate the invite token after use
        await group.save();

        // Redirect to a page confirming the user joined
        return res.redirect(`/`);
    } catch (error) {
        console.error("Error processing invite:", error);
        return res.status(500).send("Internal Server Error");
    }
};

module.exports = { create_group, create_document, get_groups, get_documents,
    add_user_to_group, generate_token
};
