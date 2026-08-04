package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.response.MasterDataResponse;

public interface MasterDataService {

    /** System items (userId null) plus items created by the given user. */
    MasterDataResponse getAllMasterData(Long userId);

}
