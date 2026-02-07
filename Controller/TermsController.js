// Controller/TermsController.js
import Terms from '../Model/TermsModel.js';

// Get active terms by type
export const getTerms = async (req, res) => {
  try {
    const { type } = req.params;
    
    const terms = await Terms.findOne({ 
      type: type,
      isActive: true 
    }).select('-__v');

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms not found'
      });
    }

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get Terms Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all terms (Admin only)
export const getAllTerms = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const terms = await Terms.find().sort({ type: 1, version: -1 });

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get All Terms Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create/Update terms (Admin only)
export const updateTerms = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { type, title, content } = req.body;

    // Validate required fields
    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and content are required'
      });
    }

    // Find active version
    const activeTerms = await Terms.findOne({ 
      type: type,
      isActive: true 
    });

    // Deactivate old version if exists
    if (activeTerms) {
      activeTerms.isActive = false;
      await activeTerms.save();
    }

    // Create new version
    const newTerms = new Terms({
      type,
      title,
      content,
      version: activeTerms ? activeTerms.version + 1 : 1,
      updatedBy: req.user.userId,
      isActive: true
    });

    await newTerms.save();

    res.status(201).json({
      success: true,
      message: 'Terms updated successfully',
      data: newTerms
    });
  } catch (error) {
    console.error('Update Terms Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};