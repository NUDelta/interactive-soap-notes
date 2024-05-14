import dbConnect from '../../lib/dbConnect';
import PracticeGapObjectModel from '../../models/PracticeGapObjectModel';
import {
  createEditLogEntry,
  createEditLogObject
} from '../editLog/createEditLogEntry';

export const updatePracticeGapObject = async (practiceGapObject: object) => {
  await dbConnect();
  let practiceGapObjectId = practiceGapObject['id'];
  let originalPracticeGapObject =
    await PracticeGapObjectModel.findById(practiceGapObjectId);
  let updatedPracticeGapObject = await PracticeGapObjectModel.findByIdAndUpdate(
    practiceGapObjectId,
    practiceGapObject,
    {
      runValidators: true,
      new: true,
      upsert: true // create a document if it doesn't exist
    }
  );

  // add to the edit log
  let newEditLogObject;
  if (originalPracticeGapObject === null) {
    // case: no original practice gap object
    newEditLogObject = createEditLogObject(
      updatedPracticeGapObject.lastUpdated,
      updatedPracticeGapObject.project,
      updatedPracticeGapObject.sig,
      'PracticeGapObject',
      practiceGapObjectId,
      {},
      updatedPracticeGapObject
    );
  } else {
    // case: original practice gap object exists
    newEditLogObject = createEditLogObject(
      updatedPracticeGapObject.lastUpdated,
      updatedPracticeGapObject.project,
      updatedPracticeGapObject.sig,
      'PracticeGapObject',
      practiceGapObjectId,
      originalPracticeGapObject,
      updatedPracticeGapObject
    );
  }
  await createEditLogEntry(newEditLogObject);
  return updatedPracticeGapObject;
};
