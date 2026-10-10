const ADMIN_DATA = {

    stats: {
        totalUsers: 12480,
        totalProviders: 486,
        verifiedProviders: 352,
        appointments: 1284,
        reviews: 3921,
        campaigns: 26
    },

    providers: [

        {
            id: "PROV-001",
            name: "Norvic International Hospital",
            category: "Hospital",
            city: "Kathmandu",
            status: "Active",
            verification: "Verified",
            rating: 4.6
        },

        {
            id: "PROV-002",
            name: "Nepal Eye Hospital",
            category: "Hospital",
            city: "Kathmandu",
            status: "Active",
            verification: "Verified",
            rating: 4.4
        },

        {
            id: "PROV-003",
            name: "CityCare Multispeciality",
            category: "Clinic",
            city: "Lalitpur",
            status: "Pending",
            verification: "Pending",
            rating: 4.2
        }

    ],

    verification: [

        {
            id: "VER-001",
            provider: "CityCare Multispeciality",
            category: "Clinic",
            location: "Lalitpur",
            submitted: "Today",
            status: "Pending"
        },

        {
            id: "VER-002",
            provider: "Himalayan Diagnostic Centre",
            category: "Diagnostic Centre",
            location: "Kathmandu",
            submitted: "Yesterday",
            status: "Pending"
        },

        {
            id: "VER-003",
            provider: "CarePlus Wellness",
            category: "Wellness Centre",
            location: "Pokhara",
            submitted: "2 days ago",
            status: "Pending"
        }

    ],

    activities: [

        {
            icon: "badge-check",
            title: "Provider verified",
            description: "Nepal Eye Hospital was verified",
            time: "12 minutes ago",
            type: "success"
        },

        {
            icon: "message-square-warning",
            title: "Review reported",
            description: "A review was flagged for moderation",
            time: "28 minutes ago",
            type: "warning"
        },

        {
            icon: "building-2",
            title: "New provider registered",
            description: "CityCare Multispeciality joined SAINO",
            time: "1 hour ago",
            type: "info"
        },

        {
            icon: "megaphone",
            title: "Campaign approved",
            description: "Health Checkup campaign approved",
            time: "2 hours ago",
            type: "purple"
        },

        {
            icon: "user-round-x",
            title: "User suspended",
            description: "A reported account was suspended",
            time: "3 hours ago",
            type: "danger"
        }

    ]

};