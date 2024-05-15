import mongoose from 'mongoose';
import { ContextObj, TextEntryStruct } from '../../models/TextEntryModel';

/**
 * Create a new text block object
 * @param type
 * @param context
 * @param value
 * @param html
 * @returns
 */
export const createNewTextEntryBlock = (
  type: 'note' | 'script' | 'follow-up' = 'note',
  context: ContextObj[] = [],
  value: string = '',
  html: string = '',
  includeId: boolean = false
): TextEntryStruct => {
  let newTextBlock = {
    type: type,
    context: context,
    value: value,
    html: html
  };

  if (includeId) {
    newTextBlock.id = new mongoose.Types.ObjectId().toString();
  }
  return newTextBlock;
};
