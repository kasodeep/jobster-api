async function runAggregation() {
  const aggregationPipeline = [
    // 1. $match - Filters documents where category is 'Electronics'
    { $match: { category: "Electronics" } },

    // 2. $project - Computes total revenue (price * quantity) and only includes relevant fields
    {
      $project: {
        _id: 0, // Excludes _id from the output
        item: 1, // Includes item name
        totalRevenue: { $multiply: ["$price", "$quantity"] }, // Calculates total revenue
      },
    },

    // 3. $sort - Sorts by total revenue in descending order
    { $sort: { totalRevenue: -1 } },

    // 4. $limit - Returns only top 2 records.
    { $limit: 2 },

    // 5. $group - Groups by category and calculates total revenue per category
    {
      $group: {
        _id: "$category",
        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        itemCount: { $sum: 1 }, // Counts number of items in each category
      },
    },

    // 6. $lookup - Joins with "products" collection to fetch more product details
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "productDetails",
      },
    },

    // 7. $unwind - Flattens the product details array
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },

    // 8. $facet - Performs two separate aggregations (total revenue & total items count)
    {
      $facet: {
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$price", "$quantity"] } },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },

    // 9. $addFields - Adds a computed discount field (10% discount)
    { $addFields: { discount: { $multiply: ["$price", 0.1] } } },

    // 10. $bucket - Categorizes sales based on price ranges
    {
      $bucket: {
        groupBy: "$price",
        boundaries: [0, 200, 500, 1000],
        default: "Expensive",
        output: { count: { $sum: 1 } },
      },
    },

    // 11. $replaceRoot - Replaces the document root with "productDetails"
    { $replaceRoot: { newRoot: "$productDetails" } },

    // 12. $redact - Removes items where price is greater than 500
    {
      $redact: {
        $cond: {
          if: { $gt: ["$price", 500] },
          then: "$$PRUNE",
          else: "$$KEEP",
        },
      },
    },

    // 13. $setWindowFields - Adds a running total revenue
    {
      $setWindowFields: {
        partitionBy: null,
        sortBy: { date: 1 },
        output: {
          cumulativeRevenue: {
            $sum: { $multiply: ["$price", "$quantity"] },
            window: { documents: ["unbounded", "current"] },
          },
        },
      },
    },

    // 14. $merge - Saves results to "sales_summary" collection
    {
      $merge: {
        into: "sales_summary",
        whenMatched: "merge",
        whenNotMatched: "insert",
      },
    },
  ];

  // Execute Aggregation
  const result = await sales.aggregate(aggregationPipeline).toArray();

  // Print result
  console.log("Aggregation Result:", JSON.stringify(result, null, 2));

  // Close connection
  await client.close();
}
