import dbConnect from "../../../lib/dbConnect";
import SOAPNote from "../../../models/SOAPNote";

// fetches all SOAP notes

export default async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    switch (method) {
        case "GET": 
            try {
                const notes = SOAPNote.find({});
                // so index.js under pages controls how this is displayed
                res.status(200).json({ success: true, data: notes });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case "POST":
            try {
                const note = await SOAPNote.create(
                    req.body
                );
                res.status(201).json({ success: true, data: note });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}