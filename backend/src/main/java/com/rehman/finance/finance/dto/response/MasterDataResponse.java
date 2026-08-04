package com.rehman.finance.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "MasterDataResponse")
public class MasterDataResponse {

    private List<SimpleMasterItem> walletTypes;
    private List<SimpleMasterItem> transactionTypes;
    private List<PurposeWithSubcategories> transactionPurposes;
    private List<SimpleMasterItem> transactionStatuses;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "SimpleMasterItem")
    public static class SimpleMasterItem {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Boolean active;
        private Long userId;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "PurposeWithSubcategories")
    public static class PurposeWithSubcategories {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Boolean active;
        private Long userId;
        private Long transactionTypeId;
        private List<SimpleMasterItem> subcategories;
    }

}
