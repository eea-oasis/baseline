const Contact = require('./mongoose_models/Contact');
const mongoose = require('mongoose');

class ContactUtils {

  // Store a new contact in Mongo
  async createContact(doc) {
    let time = await Math.floor(Date.now() / 1000);
    const mongooseId = mongoose.Types.ObjectId();
    return await Contact.findOneAndUpdate(
      { _id: mongooseId },
      {
        _id: mongooseId,
        whisperId: doc.whisperId,
        description: doc.description || 'No description',
        created: time
      },
      { upsert: true, new: true }
    );
  }

  async getAllContacts() {
    return await Contact.find({});
  }
}

module.exports = ContactUtils;