package com.rehman.finance.finance.service.impl;

import com.rehman.finance.finance.dto.response.MasterDataResponse;
import com.rehman.finance.finance.dto.response.MasterDataResponse.PurposeWithSubcategories;
import com.rehman.finance.finance.dto.response.MasterDataResponse.SimpleMasterItem;
import com.rehman.finance.finance.entity.TransactionPurpose;
import com.rehman.finance.finance.entity.TransactionSubcategory;
import com.rehman.finance.finance.repository.*;
import com.rehman.finance.finance.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MasterDataServiceImpl implements MasterDataService {

    private final WalletTypeRepository walletTypeRepository;
    private final TransactionTypeRepository transactionTypeRepository;
    private final TransactionPurposeRepository transactionPurposeRepository;
    private final TransactionStatusRepository transactionStatusRepository;
    private final TransactionSubcategoryRepository transactionSubcategoryRepository;

    @Override
    @Transactional(readOnly = true)
    public MasterDataResponse getAllMasterData(Long userId) {
        List<SimpleMasterItem> walletTypes = walletTypeRepository.findAll().stream()
                .filter(wt -> wt.getUserId() == null)
                .filter(wt -> Boolean.TRUE.equals(wt.getActive()))
                .map(wt -> SimpleMasterItem.builder()
                        .id(wt.getId())
                        .code(wt.getCode())
                        .name(wt.getName())
                        .description(wt.getDescription())
                        .active(wt.getActive())
                        .build())
                .toList();

        List<SimpleMasterItem> transactionTypes = transactionTypeRepository.findAll().stream()
                .filter(tt -> Boolean.TRUE.equals(tt.getActive()))
                .map(tt -> SimpleMasterItem.builder()
                        .id(tt.getId())
                        .code(tt.getCode())
                        .name(tt.getName())
                        .description(tt.getDescription())
                        .active(tt.getActive())
                        .build())
                .toList();

        List<SimpleMasterItem> statuses = transactionStatusRepository.findAll().stream()
                .filter(ts -> Boolean.TRUE.equals(ts.getActive()))
                .map(ts -> SimpleMasterItem.builder()
                        .id(ts.getId())
                        .code(ts.getCode())
                        .name(ts.getName())
                        .active(ts.getActive())
                        .build())
                .toList();

        List<TransactionSubcategory> allSubcategories = transactionSubcategoryRepository.findAll();

        List<PurposeWithSubcategories> purposes = transactionPurposeRepository.findAll().stream()
                .filter(tp -> Boolean.TRUE.equals(tp.getActive()))
                .filter(tp -> tp.getUserId() == null || tp.getUserId().equals(userId))
                .map(tp -> {
                    List<SimpleMasterItem> subs = allSubcategories.stream()
                            .filter(sub -> Boolean.TRUE.equals(sub.getActive()))
                            .filter(sub -> sub.getUserId() == null || sub.getUserId().equals(userId))
                            .filter(sub -> sub.getTransactionPurpose().getId().equals(tp.getId()))
                            .map(sub -> SimpleMasterItem.builder()
                                    .id(sub.getId())
                                    .code(sub.getCode())
                                    .name(sub.getName())
                                    .description(sub.getDescription())
                                    .active(sub.getActive())
                                    .userId(sub.getUserId())
                                    .build())
                            .toList();
                    return PurposeWithSubcategories.builder()
                            .id(tp.getId())
                            .code(tp.getCode())
                            .name(tp.getName())
                            .description(tp.getDescription())
                            .active(tp.getActive())
                            .userId(tp.getUserId())
                            .transactionTypeId(tp.getTransactionType().getId())
                            .subcategories(subs)
                            .build();
                })
                .toList();

        log.info("Master data retrieved");
        return MasterDataResponse.builder()
                .walletTypes(walletTypes)
                .transactionTypes(transactionTypes)
                .transactionPurposes(purposes)
                .transactionStatuses(statuses)
                .build();
    }

}
