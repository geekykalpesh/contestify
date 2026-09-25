const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5001";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "internal-secret-token-creator-contest";

const fetchContestDataFromUserService = async () => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/internal/contest-data`, {
      headers: {
        "x-internal-secret": INTERNAL_SECRET
      },
      timeout: 30000
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

const fetchPaginatedUsersFromUserService = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/internal/users/paginated`, {
      params: queryParams,
      headers: {
        "x-internal-secret": INTERNAL_SECRET
      },
      timeout: 10000
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error("Failed to fetch paginated users");
  } catch (error) {
    console.error(`[Admin Service] Error fetching paginated users: ${error.message}`);
    throw error;
  }
};

const fetchUserStatsFromUserService = async () => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/internal/users/stats`, {
      headers: {
        "x-internal-secret": INTERNAL_SECRET
      },
      timeout: 10000
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error("Failed to fetch user stats");
  } catch (error) {
    console.error(`[Admin Service] Error fetching user stats: ${error.message}`);
    throw error;
  }
};

const bulkUpdateUsersKycInUserService = async (userIds, status, reason) => {
  try {
    const response = await axios.put(
      `${USER_SERVICE_URL}/api/internal/users/bulk-kyc`,
      { userIds, status, reason },
      {
        headers: {
          "x-internal-secret": INTERNAL_SECRET
        },
        timeout: 15000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`[Admin Service] Error bulk updating KYC in User Service: ${error.message}`);
    throw error;
  }
};

module.exports = {
  fetchContestDataFromUserService,
  fetchPaginatedUsersFromUserService,
  fetchUserStatsFromUserService,
  bulkUpdateUsersKycInUserService
};
