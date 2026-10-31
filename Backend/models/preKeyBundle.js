import mongoose from 'mongoose';

const preKeyBundleSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },

    identityKey: { 
      type: String, 
      required: true 
    },     

    signedPreKey: { 
      type: String, 
      required: true 
    },    

    signedPreKeySignature: { 
      type: String, 
      required: true 
    },

    oneTimePreKeys: [{ 
      type: String 
    }]                 
  },
  {
    timestamps: true
  }
);

const PreKeyBundle = mongoose.models.PreKeyBundle || mongoose.model('PreKeyBundle', preKeyBundleSchema);

export default PreKeyBundle;