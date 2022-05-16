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
                // create a new section for each part of the SOAP note
                // let newNoteSections = {
                //     "subjective": await Section.create(req.body.S),
                //     "objective": await Section.create(req.body.O),
                //     "assessment": await Section.create(req.body.A),
                //     "plan": await Section.create(req.body.P),
                // };

                // const note = await SOAPNote.create({
                //     "S": newNoteSections.subjective._id,
                //     "O": newNoteSections.objective._id,
                //     "A": newNoteSections.assessment._id,
                //     "P": newNoteSections.plan._id
                // });

                const note = await SOAPNote.create({
                    "S": req.body.S,
                    "O": req.body.O,
                    "A": req.body.A,
                    "P": req.body.P
                });

                res.status(201).json({ success: true, data: note });
            } catch (error) {
                console.error(error);
                res.status(400).json({ success: false });
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}