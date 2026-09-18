const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5001";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "internal-secret-token-creator-contest";

const fetchContestDataFromUserService = async () => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/internal/contest-data`, {
      headers: {
        "x-internal-secret": INTERNAL_SECRET
      },
      timeout: 5000
    });

    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error("Invalid response format from User Service");
  } catch (error) {
    console.error(`[Admin Service] Error fetching data from User Service: ${error.message}`);
    throw new Error(`User Service API call failed: ${error.message}`);
  }
};

module.exports = {
  fetchContestDataFromUserService
};
