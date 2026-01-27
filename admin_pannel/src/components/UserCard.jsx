import React, { useState } from "react";

function UserCard({ user }) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="max-w-sm w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
      {/* Profile Image */}
      <img
        src={user.profile_pic || "https://via.placeholder.com/100"}
        alt={user.first_name}
        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
      />

      {/* Name, Role, Email */}
      <h2 className="mt-3 text-lg font-semibold text-gray-800">
        {user.first_name} {user.last_name}
      </h2>
      <p className="text-sm text-gray-500">{user.role}</p>
      <p className="text-sm text-gray-600">{user.email}</p>

      {/* See All Button */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="mt-4 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
      >
        {showAll ? "Hide" : "See All"}
      </button>

      {/* Expanded Info */}
      {showAll && (
        <div className="mt-4 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-semibold">Phone:</span>{" "}
            {user.phone || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Gender:</span>{" "}
            {user.gender || "N/A"}
          </p>
          <p>
            <span className="font-semibold">DOB:</span>{" "}
            {user.dob || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Address:</span>{" "}
            {(() => {
              try {
                const addr = JSON.parse(user.address || "{}");
                return `${addr.personal_address || ""} ${addr.city || ""} ${
                  addr.state || ""
                } ${addr.zip || ""} ${addr.country || ""}`;
              } catch {
                return "N/A";
              }
            })()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function UsersList({ users }) {
  return (
    <div className="flex flex-wrap gap-6 justify-center p-6">
      {users.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
    </div>
  );
}
