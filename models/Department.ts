import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    description?: string;
}

const DepartmentSchema = new Schema<IDepartment>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
}, {
    timestamps: true,
});

const DepartmentModel = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default DepartmentModel;