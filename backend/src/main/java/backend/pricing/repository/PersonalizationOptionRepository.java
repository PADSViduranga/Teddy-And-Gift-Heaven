package backend.pricing.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.pricing.model.PersonalizationOption;

public interface PersonalizationOptionRepository extends JpaRepository<PersonalizationOption, Integer> {

    List<PersonalizationOption> findAllByOrderByNameAsc();

    Optional<PersonalizationOption> findByNameIgnoreCase(String name);

    List<PersonalizationOption> findAllByOptionIdIn(Iterable<Integer> optionIds);
}
