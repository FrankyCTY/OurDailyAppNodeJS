const OperationalErr = require("../helpers/OperationalErr");
const withCatchErrorAsync = require("../utils/error/withCatchErrorAsync");
const QueryStringHandler = require("../helpers/QueryStringHandler");

exports.getAll = (Model) => {
    return withCatchErrorAsync(async (req, res) => {
        // ) EXCUTE QUERY
        const queryParamFeature = new QueryStringHandler(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
        const docs = await queryParamFeature.query;

        return res.status(200).json({
            status: "success",
            results: docs.length,
            data: {
                data: docs,
            },
        });
    })
}