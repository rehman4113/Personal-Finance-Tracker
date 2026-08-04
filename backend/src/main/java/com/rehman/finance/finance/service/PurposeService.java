package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.PurposeRequest;
import com.rehman.finance.finance.dto.request.SubcategoryRequest;
import com.rehman.finance.finance.dto.response.MasterDataResponse.SimpleMasterItem;

public interface PurposeService {

    SimpleMasterItem createPurpose(Long userId, PurposeRequest request);

    void deletePurpose(Long userId, Long purposeId);

    SimpleMasterItem createSubcategory(Long userId, Long purposeId, SubcategoryRequest request);

    void deleteSubcategory(Long userId, Long subcategoryId);

}
