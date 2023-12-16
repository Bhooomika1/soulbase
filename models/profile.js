import { Schema, model, models } from 'mongoose';

const ProfileSchema = new Schema({}, { strict: false });
const Profile = models.Profile || model('Profile', ProfileSchema);

export default Profile;