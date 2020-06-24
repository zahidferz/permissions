const { ProfileValidator } = require('../util/profileValidator');

class Profile {
  constructor(ProfileModel) {
    this.ProfileModel = ProfileModel;
  }
  async getProfile(req, res) {
    const body = req.body;
    const validator = new ProfileValidator();
    const error = validator.validateGetProfile(body);
    if (error) {
      console.log('Profile.getProfile', error);
      return res.status(400).send(error);
    }
    const profile = await this.ProfileModel.findProfile(body);
    if (profile.length > 0) {
      return res.send(profile[0]);
    }
    return res.status(204).send();
  }
}

module.exports = Profile;
