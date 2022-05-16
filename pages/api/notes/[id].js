import dbConnect from "../../../lib/dbConnect";
import SOAPNote from "../../../models/SOAPNote";

// routes for fetching a single note

export default async function handler(req, res) {
    const {
        query: { id },
        method,
    } = req;

    await dbConnect();

    switch (method) {
        case "GET": // get a note by its ID
            try {
                const note = await SOAPNote.findById(id);
                if (!note) {
                    return res.status(400).json({ success: false });
                }
                res.status(200).json({ success: true, data: note });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;

        case "PUT": // edit a note by its ID
            try {
                const note = await SOAPNote.findByIdAndUpdate(id, req.body, {
                    new: true,
                    runValidators: true,
                });
                if (!note) {
                    return res.status(400).json({ success: false });
                }
                res.status(200).json({ success: true, data: note });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;

        case "DELETE": // should this actually be possible?
            try {
                const deletedPet = await Pet.deleteOne({ _id: id});
                if (!deletedPet) {
                    return res.status(400).json({ success: false });
                }
                res.status(200).json({ success: true, data: {} });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        
        default:
            res.status(400).json({ success: false });
            break;
    }
}